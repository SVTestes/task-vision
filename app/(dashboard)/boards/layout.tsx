export default function BoardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Este layout garante que a pagina do board ocupe toda a altura
  // disponivel abaixo da DashboardNav (que esta no layout pai).
  // h-[calc(100vh-4rem)] = tela inteira menos a nav de 64px.
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
