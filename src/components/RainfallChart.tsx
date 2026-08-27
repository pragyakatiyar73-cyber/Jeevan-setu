import React, { useEffect, useRef } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from "chart.js";
import { useTheme } from "../theme/ThemeContext";

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const RainfallChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const isDark = theme === "dark";
    const tickColor = isDark ? "#94a3b8" : "#475569";
    const gridColor = isDark ? "rgba(51, 65, 85, 0.2)" : "rgba(226, 232, 240, 0.8)";

    chartInstanceRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Tue", "Wed", "Thu"],
        datasets: [
          {
            label: "Interval A",
            data: [1.2, 4.2, 8.5],
            backgroundColor: ["#22c55e", "#84cc16", "#eab308"],
            borderRadius: 4,
            barThickness: 24
          },
          {
            label: "Interval B",
            data: [0.8, 3.1, 6.2],
            backgroundColor: ["#4ade80", "#a3e635", "#f97316"],
            borderRadius: 4,
            barThickness: 24
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            ticks: { color: tickColor, font: { size: 11, weight: "bold" } },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            max: 10,
            ticks: { display: false },
            grid: { color: gridColor }
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
  }, [theme]);

  return (
    <div style={{ height: "130px", width: "100%" }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default RainfallChart;
