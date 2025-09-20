export const SideBarLogo = ({ src }: { src: string }) => {
  //   const { theme } = useTheme();
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Logo"
      width={35}
      height={35}
      className="w-12 mx-3.5 min-h-fit"
    />
  );
};
