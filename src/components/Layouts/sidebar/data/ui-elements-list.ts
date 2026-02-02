export const UI_ELEMENTS = [
  "Alerts",
  "Buttons",
  "Buttons Group",
  "Badge",
  "Breadcrumbs",
  "Cards",
  "Dropdowns",
  "Modals",
  "Tabs",
  "Tooltips",
  "Popovers",
  "Accordion",
  "Notifications",
  "Pagination",
  "Progress",
  "Carousel",
  "Images",
  "Videos",
]
  .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  .map((value) => ({
    title: value,
    url: "/ui-elements/" + value.split(" ").join("-").toLowerCase(),
    isPro: !["Alerts", "Buttons"].includes(value),
  }));
