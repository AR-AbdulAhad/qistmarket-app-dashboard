import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

import SettingBoxes from "@/components/SettingBoxes";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px]">
      <Breadcrumb pageName="Settings" />

      <SettingBoxes />
    </div>
  );
};

