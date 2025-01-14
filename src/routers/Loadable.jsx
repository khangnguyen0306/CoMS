import { Skeleton } from "antd";
import { lazy, Suspense } from "react";

const Loadable = ({ loader }) => {
  const Component = lazy(loader);


  return (
    <Suspense
      fallback={
        <Skeleton active />
      }
    >
      <Component />
    </Suspense>
  );
};

export default Loadable;
