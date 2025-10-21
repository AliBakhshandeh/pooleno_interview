interface Props {
  title: string;
  rightSection?: React.ReactNode;
}
const Navigation = ({ title, rightSection }: Props) => {
  return (
    <header className="text-white z-10 p-4 flex items-center justify-between w-full border-white/20">
      <h1 className="text-xl">{title}</h1>
      <nav className="flex gap-4 text-sm">{rightSection}</nav>
    </header>
  );
};

export default Navigation;
