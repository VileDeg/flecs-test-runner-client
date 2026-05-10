// Check BOTH the env var (for default) and the URL (for runtime toggle)
const urlParams = new URLSearchParams(window.location.search);
const isMeasureForced = urlParams.get("measure") === "true";
const isSaveToFileForced = urlParams.get("save_to_file") === "true";

const MEASURE_PERFORMANCE =
  import.meta.env.VITE_MEASURE_PERFORMANCE === "true" || isMeasureForced;

/**
 * Simple runtime profiler implementation. Used for profiling test execution time.
 */
interface IProfiler {
  markStart(testName: string): void;
  markEnd(testName: string): void;
  cancel(testName: string): void;
}

/**
 * The actual implementation for when profiling is enabled.
 */
class ClientProfiler implements IProfiler {
  private startTimes = new Map<string, number>();
  private results: { testName: string; duration: number }[] = [];

  markStart(testName: string) {
    this.startTimes.set(testName, performance.now());
  }

  markEnd(testName: string) {
    const startTime = this.startTimes.get(testName);
    if (startTime === undefined) {
      console.error("profiler: END test: ", testName, " no start time exists");
      return;
    }
    const endTime = performance.now();
    this.results.push({ testName, duration: endTime - startTime });
    this.startTimes.delete(testName);
    if (this.startTimes.size === 0) {
      this.exportToCSV(isSaveToFileForced);
    }
  }

  cancel(testName: string) {
    if (!this.startTimes.delete(testName)) {
      console.error(
        "profiler: CANCEL test: ",
        testName,
        " no start time exists",
      );
    }
  }

  private exportToCSV(saveToFile: boolean) {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");

    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const dd = pad(now.getDate());
    const mm = pad(now.getMonth() + 1);

    const header = "Test Name,Elapsed Time (ms)";
    const rows = [header];
    this.results.forEach((r) =>
      rows.push(`${r.testName},${r.duration.toFixed(4)}`),
    );
    // Reset state for next batch
    this.results = [];

    const body = rows.join("\n");
    console.log(body);
    if (!saveToFile) {
      return;
    }

    // Using dashes for time to ensure filesystem compatibility
    const timestamp = `${hh}-${min}-${ss}_${dd}_${mm}`;
    const blob = new Blob([body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ftr_client_performance_${timestamp}.csv`;
    document.body.appendChild(a); // Append to body for Firefox compatibility
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * The "No-Op" disabled version.
 */
class NoopProfiler implements IProfiler {
  markStart(_testName: string) {}
  markEnd(_testName: string) {}
  cancel(_testName: string) {}
}

/**
 * Export a single instance based on the constant.
 */
export const profiler: IProfiler = MEASURE_PERFORMANCE
  ? new ClientProfiler()
  : new NoopProfiler();
