import Foundation
import PDFKit
import Vision
import AppKit

func recognize(_ image: CGImage) throws -> [String] {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["es", "en"]
    try VNImageRequestHandler(cgImage: image).perform([request])
    return (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
}

func regionText(_ image: CGImage, x: Double, y: Double, width: Double, height: Double) throws -> [String] {
    let crop = image.cropping(to: CGRect(x: Double(image.width) * x, y: Double(image.height) * y, width: Double(image.width) * width, height: Double(image.height) * height))!
    let context = CGContext(data: nil, width: crop.width * 3, height: crop.height * 3, bitsPerComponent: 8, bytesPerRow: crop.width * 12, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    context.interpolationQuality = .high
    context.draw(crop, in: CGRect(x: 0, y: 0, width: crop.width * 3, height: crop.height * 3))
    return try recognize(context.makeImage()!)
}

func imageText(_ image: CGImage) throws -> [String: [String]] {
    return [
        "text": try recognize(image),
        "headerText": try regionText(image, x: 0.78, y: 0, width: 0.22, height: 0.1),
        "footerText": try regionText(image, x: 0, y: 0.8, width: 1, height: 0.2)
    ]
}

if CommandLine.arguments[1] == "--images" {
    var results: [[String: [String]]] = []
    for path in CommandLine.arguments.dropFirst(2) {
        let image = NSImage(contentsOfFile: path)!
        var rect = CGRect(origin: .zero, size: image.size)
        let bitmap = image.cgImage(forProposedRect: &rect, context: nil, hints: nil)!
        results.append(try imageText(bitmap))
    }
    FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: results))
    exit(0)
}

let url = URL(fileURLWithPath: CommandLine.arguments[1])
guard let document = PDFDocument(url: url) else { fatalError("Unreadable PDF") }
var pages: [[String: Any]] = []
for index in 0..<document.pageCount {
    let page = document.page(at: index)!
    let bounds = page.bounds(for: .mediaBox)
    let scale = 2.0
    let width = Int(bounds.width * scale)
    let height = Int(bounds.height * scale)
    let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    context.setFillColor(NSColor.white.cgColor)
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: context)
    let image = context.makeImage()!
    let text = try imageText(image)
    let pixels = context.data!.assumingMemoryBound(to: UInt8.self)
    let offset = (10 * width + 10) * 4
    let corner = (0..<3).map { Int(pixels[offset + $0]) }
    let destinations = page.annotations.compactMap { annotation -> Int? in
        let destination = annotation.destination ?? (annotation.action as? PDFActionGoTo)?.destination
        guard let target = destination?.page else { return nil }
        return document.index(for: target) + 1
    }
    if index == 0 || index == document.pageCount - 1 {
        let bitmap = NSBitmapImageRep(cgImage: image)
        let output = url.deletingPathExtension().appendingPathExtension("page-\(index + 1).png")
        try bitmap.representation(using: .png, properties: [:])!.write(to: output)
    }
    pages.append(["width": bounds.width, "height": bounds.height, "destinations": destinations, "corner": corner, "text": text["text"]!, "headerText": text["headerText"]!, "footerText": text["footerText"]!])
}
let result: [String: Any] = ["count": document.pageCount, "pages": pages]
let data = try JSONSerialization.data(withJSONObject: result, options: [.sortedKeys])
FileHandle.standardOutput.write(data)
