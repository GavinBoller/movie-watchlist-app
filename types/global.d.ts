// Add iOS timer property to window
interface Window {
  iosResultTimer?: ReturnType<typeof setTimeout>;
}
