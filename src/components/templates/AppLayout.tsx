interface Props {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  nav: React.ReactNode;
}

export function AppLayout({ left, center, right, nav }: Props) {
  return (
    <>
      <div className="app-layout">
        {left}
        {center}
        {right}
      </div>
      {nav}
    </>
  );
}
