// 1. Define your toggle (usually in a config file or env variable)
//const MEASURE_PERFORMANCE = import.meta.env.VITE_MEASURE_PERFORMANCE === 'true';

// Check BOTH the env var (for default) and the URL (for runtime toggle)
const urlParams = new URLSearchParams(window.location.search);
const isMeasureForced = urlParams.get("measure") === "true";

const MEASURE_PERFORMANCE =
  import.meta.env.VITE_MEASURE_PERFORMANCE === "true" || isMeasureForced;

// 2. Define the interface so the rest of the app doesn't care which version it uses
interface IProfiler {
  markStart(testName: string): void;
  markEnd(testName: string): void;
  cancel(testName: string): void;
}

// 3. The actual implementation (same as before)
class ClientProfiler implements IProfiler {
  private startTimes = new Map<string, number>();
  private results: { testName: string; duration: number }[] = [];
  private activeTests = 0;

  markStart(testName: string) {
    console.log("profiler: START test: ", testName);
    this.startTimes.set(testName, performance.now());
    this.activeTests++;
  }

  markEnd(testName: string) {
    console.log("profiler: END test: ", testName);
    const endTime = performance.now();
    if (this.activeTests < 1) {
      console.error("profiler: END test: ", testName, " with no active tests");
      return;
    }
    const startTime = this.startTimes.get(testName);
    if (startTime === undefined) {
      console.error("profiler: END test: ", testName, " no start time exists");
      return;
    }
    this.results.push({ testName, duration: endTime - startTime });
    this.startTimes.delete(testName);
    this.activeTests--;
    if (this.activeTests === 0 && this.results.length > 0) {
      this.exportToCSV();
    }
  }

  cancel(testName: string) {
    console.log("profiler: CANCEL test: ", testName);
    if (!this.startTimes.delete(testName)) {
      console.error(
        "profiler: CANCEL test: ",
        testName,
        " no start time exists",
      );
    }
  }

  private exportToCSV() {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");

    const hh = pad(now.getHours());
    const min = pad(now.getMinutes());
    const ss = pad(now.getSeconds());
    const dd = pad(now.getDate());
    const mm = pad(now.getMonth() + 1);

    // Using dashes for time to ensure filesystem compatibility
    const timestamp = `${hh}-${min}-${ss}_${dd}_${mm}`;

    const rows = ["Test Name,Elapsed Time (ms)"];
    this.results.forEach((r) =>
      rows.push(`${r.testName},${r.duration.toFixed(4)}`),
    );

    console.log(rows.join("\n"));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ftr_client_performance_${timestamp}.csv`;
    document.body.appendChild(a); // Append to body for Firefox compatibility
    a.click();
    document.body.removeChild(a);

    // Reset state for next batch
    this.results = [];
    URL.revokeObjectURL(url);
  }
}

// 4. The "No-Op" version that does nothing
class NoopProfiler implements IProfiler {
  markStart(_testName: string) {}
  markEnd(_testName: string) {}
  cancel(_testName: string) {}
}

// 5. Export a single instance based on the constant
export const profiler: IProfiler = MEASURE_PERFORMANCE
  ? new ClientProfiler()
  : new NoopProfiler();
