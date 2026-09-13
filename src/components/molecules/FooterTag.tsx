import { useSettingsStore } from '../../store/useSettingsStore';
import { normalizeFooterUrl } from '../../utils/links';

export function FooterTag() {
  const label = useSettingsStore((s) => s.footerTag);
  const url = useSettingsStore((s) => s.footerTagUrl);
  if (!label.trim()) return null;
  const href = normalizeFooterUrl(url);
  return href ? <a className="footer-tag" href={href} target="_blank" rel="noopener noreferrer">{label}</a> : <span className="footer-tag">{label}</span>;
}
