import React from "react"
import styles from "./Leaderboard.module.css"
import { exec } from "child_process"

import { AgGridReact } from 'ag-grid-react';

import { ICellRendererParams } from 'ag-grid-community';

function mean(array: Array<number>) {
  return array.reduce((a, b) => a + b, 0) / array.length
}

function formatNumber(number: number) {
  return Number(number.toFixed(1))
}

function get_pass_at_1(
  results_df: Array<any>,
  index: number,
  start: number,
  end: number
) {
  const results = results_df.filter(
    (result) =>
      result["index"] === index
  )
  const dictionary: { [key: string]: any } = {};

  if (results.length > 0 && results[0] !== null) {
    Object.keys(results[0]).forEach(key => {
      // 直接将字符串赋值给 dictionary[key]
      dictionary[key] = results[0][key];
    });
  } else {
    console.log(`${index}: 不存在`);
  }

  return {
    dictionary
  }
}

function getLeaderboard(
  performances: Array<any>,
  models: Array<any>,
  indexs: Array<any>,
  start: number,
  end: number
) {

  return indexs
    .map((index) => {
      const { dictionary } = get_pass_at_1(
        performances,
        index,
        0,
        0
      )
      let output: { [key: string]: any } = {}
      
      // 根据 index 找到对应的 model
      const model = performances.find(model => model.index === index);
      
      if (model) {
        output["Model"] = model.model;
      } else {
        output["Model"] = "Unknown"; // 如果没有找到对应的 model，可以设置一个默认值
      }
      
      output["Contaminated"] = false 
      Object.keys(dictionary).forEach(key => {
        if (key != "model" && key != "date" && key != "index") {
          output[key] = dictionary[key];
        }
      });
      return output
    })
    .sort((a, b) => {
      const af1 = parseFloat(a["Overall-results_F-Score"]);
      const bf1 = parseFloat(b["Overall-results_F-Score"]);
      const acga = parseFloat(b["Overall-results_CGA"]);
      const bcga = parseFloat(b["Overall-results_CGA"]);


      if (af1 !== bf1) {
        return bf1 - af1; // 先按胜率排序
      } else {
        return bcga - acga; // 胜率相同则按不输不赢的概率排序
      }
    })
    .reduce(
      (
        acc: {
          results: Array<typeof model & { Rank: number | null }>
          rank: number
        },
        model
      ) => {
        let rank = null
        rank = acc.rank
        const currentf1 = parseFloat(model["Overall-results_F-Score"]);
        const currentcga = parseFloat(model["Overall-results_CGA"]);

        if (acc.results.length > 0) {
          const lastf1 = parseFloat(acc.results[acc.results.length - 1]["Overall-results_F-Score"]);
          const lastcga = parseFloat(acc.results[acc.results.length - 1]["Overall-results_CGA"]);

          if (currentf1 !== lastf1 || currentcga !== lastcga) {
            acc.rank += 1
            rank = acc.rank
          }
        }

        acc.results.push({
          Rank: rank,
          ...model,
        })
        return acc
      },
      { results: [], rank: 1 }
    ).results
}

function getDateMarksFromTimestamps(timestamps: Array<number>) {
  return timestamps.map((timestamp) => ({
    value: timestamp,
    label: new Date(timestamp).toLocaleDateString(undefined, {
      timeZone: "UTC",
    }),
  }))
}

function getMaxValues(performances: Array<any>) {
  // 需要比较的键
  const keysToCompare = [
    "Overall-results_CO",
    "Overall-results_NA",
    "Overall-results_IN",
    "Overall-results_CGA",
    "Overall-results_F-Score",
    "F-score_LS",
    "F-score_OIR",
    "F-score_TE",
    "F-score_PE",
    "F-score_LB",
    "F-score_TP",
    "F-score_QPR",
    "F-score_AC",
    "F-score_OAR",
  ];

  // 初始化最大值字典
  const maxValues: { [key: string]: string } = {};

  // 遍历 performances 数组
  performances.forEach(performance => {
    keysToCompare.forEach(key => {
      const value = performance[key];
      // 如果当前键还没有最大值，或者当前值的胜率更大，或者胜率相同但不输不赢的概率更大，则更新最大值
      if (!maxValues[key] || parseFloat(value) > parseFloat(maxValues[key]) ) {
        maxValues[key] = value;
      }
    });
  });

  return maxValues;
}

function getColumnDefs(columnNames: Array<string>, performances: Array<any>, modelsDict: any, page_idx: string) {
  // 获取最大值
  let maxValues = getMaxValues(performances);
  console.log("columnNames :", columnNames);
  console.log("performances :", performances);
  console.log("page_idx :", page_idx);
  if (page_idx == "lines"){
    let columnDefs = [
      {
        headerName: "Models",
        field: "Model"
      },
      {
        headerName: 'Rank',
        field: 'Rank',
        minWidth: 75
      },
      {
        headerName: "Overall results", // 顶层列组
        // CO NA IN CGA F-Score LS OIR TE PE LB TP OPR AC OAR
        children: [
          { headerName: "F-Score", field: "Overall-results_F-Score",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["Overall-results_F-Score"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "CO", field: "Overall-results_CO",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["Overall-results_CO"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "NA", field: "Overall-results_NA",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["Overall-results_NA"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "IN", field: "Overall-results_IN",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["Overall-results_IN"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "CGA", field: "Overall-results_CGA",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["Overall-results_CGA"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
        ] 
      },
      {
        headerName: "F-score on 9 task categories", // 顶层列组
        // LS OIR TE PE LB TP OPR AC OAR
        children: [
          { headerName: "LS", field: "F-score_LS",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["F-score_LS"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "OIR", field: "F-score_OIR",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["F-score_OIR"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "TE", field: "F-score_TE",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["F-score_TE"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "PE", field: "F-score_PE",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["F-score_PE"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "LB", field: "F-score_LB",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["F-score_LB"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "TP", field: "F-score_TP",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["F-score_TP"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "OPR", field: "F-score_QPR",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["F-score_QPR"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "AC", field: "F-score_AC",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["F-score_AC"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "OAR", field: "F-score_OAR",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["F-score_OAR"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
        ] 
      },
    ]
    return columnDefs;
  }
  else{
  let columnDefs = [
    {
      headerName: 'Model',
      children: [
        {
          headerName: 'Open',
          field: 'Group1',
          rowGroup: true,  // 行组分组
          hide: true,  // 行组分组需要隐藏列
        },
        {
          headerName: 'Name',
          field: 'Model',
          pinned: "left"
        }
      ]
    },
    {
      headerName: 'Rank',
      field: 'Rank',
      minWidth: 75
    },
    {
      headerName: "Overall results", // 顶层列组
      // CO NA IN CGA F-Score LS OIR TE PE LB TP OPR AC OAR
      children: [
        { headerName: "F-Score", field: "Overall-results_F-Score",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["Overall-results_F-Score"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "CO", field: "Overall-results_CO",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["Overall-results_CO"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "NA", field: "Overall-results_NA",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["Overall-results_NA"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "IN", field: "Overall-results_IN",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["Overall-results_IN"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "CGA", field: "Overall-results_CGA",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["Overall-results_CGA"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
      ] 
    },
    {
      headerName: "F-score on 9 task categories", // 顶层列组
      // LS OIR TE PE LB TP OPR AC OAR
      children: [
        { headerName: "LS", field: "F-score_LS",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["F-score_LS"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "OIR", field: "F-score_OIR",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["F-score_OIR"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "TE", field: "F-score_TE",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["F-score_TE"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "PE", field: "F-score_PE",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["F-score_PE"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "LB", field: "F-score_LB",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["F-score_LB"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "TP", field: "F-score_TP",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["F-score_TP"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "OPR", field: "F-score_QPR",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["F-score_QPR"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "AC", field: "F-score_AC",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["F-score_AC"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "OAR", field: "F-score_OAR",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["F-score_OAR"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
      ] 
    }
  ];
  return columnDefs;
  }
}

export { getDateMarksFromTimestamps, getLeaderboard, getColumnDefs }
