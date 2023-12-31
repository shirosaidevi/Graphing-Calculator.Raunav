import { Navigation } from "../../components/Navigation";

export const metadata = {
  title: "Mr. Pullen's Graphing Calculator",
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div>
      <Navigation />
      {children}
    </div>
  );
}
