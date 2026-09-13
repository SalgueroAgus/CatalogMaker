import { useRef } from 'react';
import { ImagePlus, Plus } from 'lucide-react';
import { useProductStore } from '../../store/useProductStore';
import { Button } from '../atoms/Button';

export function AddArticles() {
  const input = useRef<HTMLInputElement>(null);
  const addProducts = useProductStore((s) => s.addProducts);
  const addBlankProduct = useProductStore((s) => s.addBlankProduct);
  return <div className="add-articles">
    <input ref={input} type="file" multiple accept="image/*" hidden onChange={(event) => {
      void addProducts(Array.from(event.target.files ?? []));
      event.target.value = '';
    }} />
    <Button variant="export" onClick={() => input.current?.click()}><ImagePlus size={18} />Cargar fotos</Button>
    <Button onClick={() => void addBlankProduct()}><Plus size={18} />Agregar producto</Button>
  </div>;
}
