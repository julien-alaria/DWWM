// For use of trading view charts widget

/*export function loadTradingViewChart(ticker) {

  new TradingView.widget({
    container_id: `tv-${ticker}`,
    symbol: ticker,
    interval: "W",
    autosize: true,
    theme: "light",
    style: "1",
    locale: "en",
    hide_top_toolbar: true,
    hide_legend: true,
    allow_symbol_change: false
  })
}*/

// For use of ApexCharts
import { formatChartId } from "./format.js"
import { registerChart, destroyChart } from "./chartManager.js"

export function loadTradingViewChart(ticker, historyData = []) {

  const container = document.getElementById(formatChartId(ticker))
  if (!container || !historyData.length) return

  // mapping Polygon Datas (x, o, h, l, c)
  const candlestickData = historyData.map((candle) => ({
    x: candle.x,
    y: [candle.o, candle.h, candle.l, candle.c]
  }))

  const options = {
    chart: {
      type: "candlestick",
      height: 350,
      fontFamily: 'Inter, sans-serif',
      sparkline: {
        enabled: false
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: true
      },
      background: "transparent",
      animations: {
        enabled: true
      }
    },

    series: [{
      name: ticker,
      data: candlestickData
    }],

    plotOptions: {
      candlestick: {
        colors: {
          upward: "#089981",
          downward: "#f23645"
        },
        wick: {
          useFillColor: true
        }
      }
    },

    xaxis: {
      type: "datetime",
      labels: {
        show: true
      }
    },

    yaxis: {
      show: true,
      tooltip: {
        enabled: true
      }
    },

    grid: {
      show: false,
      borderColor: "#333"
    },

    tooltip: {
      enabled: true,
      theme: "dark"
    }
  }

  destroyChart(ticker)
  container.innerHTML = ''
  const chart = new ApexCharts(container, options)
  chart.render()
  registerChart(ticker, chart)
}

//Mini Sparkline Chart for cards
export function loadMiniChart(ticker, historyData = []) {
  const container = document.getElementById(formatChartId(ticker))  
  if (!container || !historyData.length) return

  // Isolate the last 15 points
  const limitedHistory = historyData.slice(-15)

  // Data Normalization
  const cleanData = limitedHistory.map((point) => {
    if (point === null || point === undefined) return 0
    if (typeof point === 'number') return point
    return point.c ?? point.close ?? point.price ?? point.value ?? point.y ?? 0
  })

  // Calculating the trend (Is the latest price higher than the first?)
  const firstPrice = cleanData[0] || 0
  const lastPrice = cleanData[cleanData.length - 1] || 0
  const isPositive = lastPrice >= firstPrice

  const chartColor = isPositive ? "#089981" : "#f23645"

  // graphics configuration (Area with neon gradient)
  const options = {
    chart: {
      type: "area", 
      height: 80,
      sparkline: {
        enabled: true
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        dynamicAnimation: {
          speed: 600
        }
      },
      background: "transparent",
      dropShadow: {
        enabled: true,
        top: 2,
        left: 0,
        blur: 4,
        color: chartColor,
        opacity: 0.15
      }
    },
    stroke: {
      curve: "smooth",
      width: 2.5      
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.0,
        stops: [0, 90, 100]
      }
    },
    series: [{
      name: ticker,
      data: cleanData
    }],
    colors: [chartColor], 
    tooltip: {
      enabled: false
    }
  }

  destroyChart(ticker)
  container.innerHTML = ''
  const chart = new ApexCharts(container, options)
  chart.render()
  registerChart(ticker, chart)
}