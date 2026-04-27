interface SwitcherOneProps {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  disabled?: boolean;
}

const SwitcherOne = ({ enabled, setEnabled, disabled }: SwitcherOneProps) => {
  return (
    <div>
      <label
        className={`flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer select-none'}`}
      >
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={enabled}
            disabled={disabled}
            onChange={() => {
              setEnabled(!enabled);
            }}
          />
          <div className={`block h-8 w-14 rounded-full ${enabled ? 'bg-primary' : 'bg-gray-3 dark:bg-[#5A616B]'}`}></div>
          <div
            className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow-switch-1 transition ${
              enabled && "!right-1 !translate-x-full !bg-white"
            }`}
          ></div>
        </div>
      </label>
    </div>
  );
};

export default SwitcherOne;
