/** Keep the supplied Latin wordmark in its original reading direction in both interfaces. */
export function Brand({ welcome = false }: { welcome?: boolean }) {
  return <div className={welcome ? "welcome-brand" : "brand"} dir="ltr">
    <img src="/branding/cevora-logo.png" width={420} height={150} alt="Cevora — Online CV Builder" />
  </div>;
}
