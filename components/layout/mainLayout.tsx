import Navigation from "./navigation";

interface Props {
  children: React.ReactNode;
  hasNavigationBar?: boolean;
  title: string;
  rightSection?: React.ReactNode;
}
const MainLayout = ({
  children,
  hasNavigationBar = false,
  title,
  rightSection,
}: Props) => {
  return (
    <div className="min-h-screen flex flex-col">
      {hasNavigationBar && (
        <Navigation title={title} rightSection={rightSection} />
      )}
      <main className=" p-4">{children}</main>
    </div>
  );
};

export default MainLayout;
