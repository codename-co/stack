type CardsProps = {
  className?: string;
  id?: string;
  children?: React.ReactNode;
};

const Cards: React.FC<CardsProps> = ({ className, children, id }) => {
  return (
    <ol
      id={id}
      className={`relative flex-wrap light gap-6 pt-4 pb-10 px-8 -mx-8 ${
        className ?? ""
      }`}
    >
      {/* <ol className="light flex flex-nowrap overflow-x-auto gap-6 pt-4 pb-10 px-8 -mx-8"> */}
      {children}
    </ol>
  );
};

export default Cards;
