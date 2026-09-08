"use client";

// Bikes don't have an IMEI — they're identified by an Engine Number + Chassis
// Number instead. The backend/DB still only has a single free-form
// `imei_serial` string column (no migration needed for this), so for bike
// rows we encode both numbers into that one string and split them back out
// for editing.

export const isBikeCategory = (category?: string) => /bike/i.test(category || "");

export const parseEngineChassis = (value: string) => {
    if (!value) return { engine: "", chassis: "" };
    const engMatch = value.match(/ENG:([^|]*)/i);
    const chsMatch = value.match(/CHS:(.*)/i);
    if (engMatch || chsMatch) {
        return {
            engine: engMatch ? engMatch[1].trim() : "",
            chassis: chsMatch ? chsMatch[1].trim() : "",
        };
    }
    // Legacy/raw value (e.g. a barcode scan landing here before the format
    // existed) — surface it in Engine rather than silently dropping it.
    return { engine: value.trim(), chassis: "" };
};

export const formatEngineChassis = (engine: string, chassis: string) => {
    if (!engine.trim() && !chassis.trim()) return "";
    return `ENG:${engine.trim()} | CHS:${chassis.trim()}`;
};

interface Props {
    category: string;
    value: string;
    onChange: (value: string) => void;
    index: number;
    compact?: boolean;
}

export default function SerialOrEngineChassisInput({ category, value, onChange, index, compact }: Props) {
    const inputClass = compact
        ? "w-full bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded-lg px-2 py-1 outline-none focus:border-primary font-mono text-gray-600 dark:text-gray-400 placeholder:text-gray-300 text-xs shadow-sm"
        : "w-full bg-gray-50 dark:bg-meta-4 border border-stroke dark:border-strokedark rounded-xl px-4 py-3 outline-none focus:border-primary text-sm font-bold text-gray-600 dark:text-gray-400 focus:shadow-md transition-all";

    if (isBikeCategory(category)) {
        const { engine, chassis } = parseEngineChassis(value);
        return (
            <div className="space-y-1.5">
                <input
                    type="text"
                    value={engine}
                    onChange={(e) => onChange(formatEngineChassis(e.target.value, chassis))}
                    placeholder={`Engine Number ${index + 1}...`}
                    className={inputClass}
                />
                <input
                    type="text"
                    value={chassis}
                    onChange={(e) => onChange(formatEngineChassis(engine, e.target.value))}
                    placeholder={`Chassis Number ${index + 1}...`}
                    className={inputClass}
                />
            </div>
        );
    }

    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Scan IMEI ${index + 1}...`}
            data-is-imei="true"
            className={inputClass}
        />
    );
}
