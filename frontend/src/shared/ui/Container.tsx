import type { PropsWithChildren } from "react";

interface ContainerProps {
  className?: string;
}

const Container = ({
  children,
  className = "",
}: PropsWithChildren<ContainerProps>) => {
  return (
    <div className={`mx-auto max-w-7xl px-6 ${className}`}>{children}</div>
  );
};

export default Container;
