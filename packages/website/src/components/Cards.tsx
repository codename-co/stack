type CardsProps = {
  className?: string;
  id?: string;
  children?: React.ReactNode;
};

/**
 * The list wrapper for <Card>. GlassCard carries its own padding and halo, so
 * this only has to provide the gutter — and enough vertical padding for the
 * hover lift not to clip against the row above.
 */
const Cards: React.FC<CardsProps> = ({ className, children, id }) => {
  return (
    <ol
      id={id}
      className={`relative flex-wrap light gap-6 pt-4 pb-10 ${className ?? ""}`}
    >
      {children}
    </ol>
  );
};

export default Cards;
