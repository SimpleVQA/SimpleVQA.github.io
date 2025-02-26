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

function tab2_getLeaderboard(
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
      const aengf1 = parseFloat(a["English_F-score"]);
      const bengf1 = parseFloat(b["English_F-score"]);
      const achf1 = parseFloat(b["Chinese_F-score"]);
      const bchf1 = parseFloat(b["Chinese_F-score"]);

      if (aengf1 !== bengf1) {
        return bengf1 - aengf1; // 先按胜率排序
      } else {
        return bchf1 - achf1; // 胜率相同则按不输不赢的概率排序
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
        const currentengf1 = parseFloat(model["English_F-score"]);
        const currentchf1 = parseFloat(model["Chinese_F-score"]);

        if (acc.results.length > 0) {
          const lastengf1 = parseFloat(acc.results[acc.results.length - 1]["English_F-score"]);
          const lastchf1 = parseFloat(acc.results[acc.results.length - 1]["Chinese_F-score"]);

          if (currentengf1 !== lastengf1 || currentchf1 !== lastchf1) {
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

function tab2_getDateMarksFromTimestamps(timestamps: Array<number>) {
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
    "Chinese_CO",
    "Chinese_CGA",
    "Chinese_F-score",
    "English_CO",
    "English_CGA",
    "English_F-score",
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

function tab2_getColumnDefs(columnNames: Array<string>, performances: Array<any>, modelsDict: any, page_idx: string) {
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
        headerName: "English partial results", // 顶层列组
        // CO NA IN CGA F-Score LS OIR TE PE LB TP OPR AC OAR
        children: [
          { headerName: "CO", field: "English_CO",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["English_CO"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "CGA", field: "English_CGA",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["English_CGA"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "F-score", field: "English_F-score",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["English_F-score"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
        ] 
      },
      {
        headerName: "Chinese partial results", // 顶层列组
        // CO NA IN CGA F-Score LS OIR TE PE LB TP OPR AC OAR
        children: [
          { headerName: "CO", field: "Chinese_CO",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["Chinese_CO"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "CGA", field: "Chinese_CGA",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["Chinese_CGA"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
          { headerName: "F-score", field: "Chinese_F-score",
            cellStyle: (params: ICellRendererParams) => {
              if (params.value === maxValues["Chinese_F-score"]) {
                return { color: 'red' };
              }
              return null;
            }
          }, // 子列
        ] 
      },
      {
        headerName: "F-score on 9 domains categories", // 顶层列组
        //  LES EHC CS ETA FTM NS AR CHC LI
        children: [
          { headerName: "LS", field:"F-score_LS",
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
          { headerName: "QPR", field: "F-score_QPR",
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
      headerName: "English partial results", // 顶层列组
      // CO NA IN CGA F-Score LS OIR TE PE LB TP OPR AC OAR
      children: [
        { headerName: "CO", field: "English_CO",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["English_CO"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "CGA", field: "English_CGA",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["English_CGA"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "F-score", field: "English_F-score",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["English_F-score"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
      ] 
    },
    {
      headerName: "Chinese partial results", // 顶层列组
      // CO NA IN CGA F-Score LS OIR TE PE LB TP OPR AC OAR
      children: [
        { headerName: "CO", field: "Chinese_CO",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["Chinese_CO"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "CGA", field: "Chinese_CGA",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["Chinese_CGA"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
        { headerName: "F-score", field: "Chinese_F-score",
          cellStyle: (params: ICellRendererParams) => {
            if (params.value === maxValues["Chinese_F-score"]) {
              return { color: 'red' };
            }
            return null;
          }
        }, // 子列
      ] 
    },
    {
      headerName: "F-score on 9 domains categories", // 顶层列组
      //  LES EHC CS ETA FTM NS AR CHC LI
      children: [
        { headerName: "LS", field:"F-score_LS",
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
        { headerName: "QPR", field: "F-score_QPR",
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
  ];
  return columnDefs;
  }
}

export { tab2_getDateMarksFromTimestamps, tab2_getLeaderboard, tab2_getColumnDefs }
