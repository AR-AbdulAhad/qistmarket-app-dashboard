type ColumnFilterProps = {
  column: {
    filterValue: string;
    setFilter: (value: string) => void;
  };
};

const ColumnFilter = ({ column }: ColumnFilterProps) => {
  const { filterValue, setFilter } = column;

  return (
    <input
      type="text"
      value={filterValue || ""}
      onChange={(e) => setFilter(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="mt-2.5 w-full rounded-md border border-stroke px-3 py-1 outline-none focus:border-[#ff3d3d]"
    />
  );
};

export default ColumnFilter;
