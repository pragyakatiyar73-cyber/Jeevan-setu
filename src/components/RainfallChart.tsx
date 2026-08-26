import React, { useEffect, useRef } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title
} from "chart.js";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

interface RainfallChartProps {
  dataPoints?: { day: string; rainfall: number }[];
}

const RainfallChart: React.FC<RainfallChartProps> = ({
  dataPoints = [
    { day: "Tue", rainfall: 3.5 }, // Safe (< 4.0)
    { day: "Wed", rainfall: 5.8 }, // Moderate (4.0 - 7.0)
    { day: "Thu", rainfall: 8.9 }  // High Risk (> 7.0)
  ]
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const labels = dataPoints.map(d => d.day);
    const dataValues = dataPoints.map(d => d.rainfall);

    // Color coding based on user threshold rules:
    // Safe < 4.0 (Green #22c55e)
    // Moderate 4.0 - 7.0 (Yellow #eab308)
    // High Risk > 7.0 (Red #ef4444)
    const backgroundColors = dataValues.map(val => {
      if (val < 4.0) return "#22c55e"; // Green
      if (val <= 7.0) return "#eab308"; // Yellow
      return "#ef4444"; // Red
    });

    const borderColors = dataValues.map(val => {
      if (val < 4.0) return "#15803d";
      if (val <= 7.0) return "#a16207";
      return "#b91c1c";
    });

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Precipitation Rate (mm/hr)",
          data: dataValues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderRadius: 8,
          barThickness: 36
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.raw as number;
                let risk = "Safe (<4.0)";
                if (val >= 4.0 && val <= 7.0) risk = "Moderate (4.0–7.0)";
                if (val > 7.0) risk = "High Risk (>7.0)";
                return `Rainfall: ${val} mm/hr [${risk}]`;
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: "#cbd5e1", font: { weight: "bold" } },
            grid: { color: "rgba(51, 65, 85, 0.4)" }
          },
          y: {
            beginAtZero: true,
            max: 12,
            ticks: { color: "#cbd5e1" },
            grid: { color: "rgba(51, 65, 85, 0.4)" },
            title: {
              display: true,
              text: "Rainfall (mm/hr)",
              color: "#94a3b8",
              font: { size: 11 }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [dataPoints]);

  return (
    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          72-Hour Hazard Timeline Graph
        </h4>
        <div className="flex items-center gap-3 text-[11px] font-medium">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Safe (&lt;4.0)
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate (4.0–7.0)
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High Risk (&gt;7.0)
          </span>
        </div>
      </div>

      <div style={{ height: "240px", width: "100%" }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default RainfallChart;
