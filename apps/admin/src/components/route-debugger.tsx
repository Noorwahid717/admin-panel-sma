import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const RouteDebugger = () => {
  const location = useLocation();

  useEffect(() => {
    const { pathname, search, hash } = location;
    const locationText = `${pathname}${search}${hash}`;
    console.info("[Route]", locationText);
  }, [location]);

  return null;
};
