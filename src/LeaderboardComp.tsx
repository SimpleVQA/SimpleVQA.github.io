import React, { useMemo, useRef, useEffect, useState } from "react"
import { AgGridReact } from "ag-grid-react"
import "ag-grid-community/styles/ag-grid.css" // Core CSS
import "ag-grid-community/styles/ag-theme-quartz.css" // Theme
import "./LeaderboardComp.css"
import { createTheme } from "@mui/material/styles"
import { ICellRendererParams } from 'ag-grid-community';

// import 'ag-grid-enterprise'
// import { LicenseManager } from 'ag-grid-enterprise';

// import 'ag-grid-enterprise/row-grouping'
// AG Grid: rowGroup is only available when @ag-grid-enterprise/row-grouping is loaded.
import {
  getColumnDefs,
  getDateMarksFromTimestamps,
  getLeaderboard,
} from "./leaderboardLib"

import {
  tab2_getColumnDefs,
  tab2_getDateMarksFromTimestamps,
  tab2_getLeaderboard,
} from "./leaderboardLib_tab2"

import "./LeaderboardAgGrid.css"
import styles from "./Leaderboard.module.css"

// LicenseManager.setLicenseKey('your-license-key-here');

const FONT_FAMILY = "'JetBrains Mono', monospace, 0.3em"

function getColumns(columnNames: Array<string>, performances: Array<any>, modelsDict: any, page_idx: string, tab_idx: string = "tab1") {
  if (tab_idx == "tab1"){
    return getColumnDefs(columnNames, performances, modelsDict, page_idx);
  }
  return tab2_getColumnDefs(columnNames, performances, modelsDict, page_idx);
}

const Leaderboard = React.memo(function LeaderboardComponent(props: any) {
  // args from Streamlit
  let args = props.args;
  
  const [{ performances, models, date_marks, indexs}, page_idx, tab_idx]= args;

  console.log("performances :", performances)
  const [isMobileCompressed, setIsMobileCompressed] = useState(window.innerWidth < 768);

  const modelsDict = useMemo(() => {
    return models.reduce((acc: any, model: any) => {
      acc[model.model_name] = model
      return acc
    }, {})
  }, [models])


  // ********* DateSlider *********

  // const dateMarks = getDateMarksFromTimestamps(date_marks)
  const [dateMarks, setDateMarks] = React.useState(() => getDateMarksFromTimestamps(date_marks));

  useEffect(() => {
    // console.log('Component re-rendered due to changes in date_marks:', date_marks);
    setDateMarks(getDateMarksFromTimestamps(date_marks));
  }, [date_marks]);

  const [dateStartAndEnd, setDateStartAndEnd] = React.useState<number[]>([
    dateMarks[4].value, // Right now, this is 2023-05-01
    dateMarks[dateMarks.length - 1].value,
  ])

  function dateLabelFormat(value: number) {
    const index = dateMarks.findIndex((mark) => mark.value === value)
    return dateMarks[index].label
  }

  const dateAriaText = dateLabelFormat

  const leaderboard = useMemo(() => {
    return getLeaderboard(
      performances,
      models,
      indexs,
      //dateStartAndEnd[0],
      //dateStartAndEnd[1]
      0,0
    );
  }, [performances, models, dateStartAndEnd]);

  const numProblems = performances.filter(
    (result: any) =>
      //result["date"] >= dateStartAndEnd[0] &&
      //result["date"] <= dateStartAndEnd[1]
      result["date"] >= 0 &&
      result["date"] <= 1
  ).length;


  // df is an array of objects
  // Get the columns of df
  const columnNames = useMemo(() => {
    return Object.keys(leaderboard[0])
  }, [leaderboard]);

  // Object.keys(leaderboard[0])

  const defaultColDef = useMemo(() => {
    return {
      // flex: 1,
      sortable: true,
      resizable: true,
      // filter: true,
      filter: false, // 禁用过滤
      suppressHeaderMenuButton: true, // 禁用列菜单
    }
  }, [])

  const rowClassRules = useMemo(() => {
    return {
      [styles.leaderboardModelContaminated]: (params: any) =>
        params.data["Contaminated"],
    }
  }, [])

  const gridRef = useRef()
  const [rowData, setRowData] = useState(leaderboard)

  useEffect(() => {
    // console.log('Component re-rendered due to changes in leaderboard:', leaderboard);
    setRowData(leaderboard);
  }, [leaderboard]);


  const [columnDefs, setColumnDefs] = useState(
      getColumns(columnNames, performances, modelsDict, page_idx, tab_idx)
    )
    useEffect(() => {
      // console.log('Component re-rendered due to changes in column:', columnNames, modelsDict);
      setColumnDefs(getColumns(columnNames, performances, modelsDict, page_idx, tab_idx));
    }, [columnNames, modelsDict, page_idx]);

  const muiTheme = createTheme({
    palette: {
      mode: props.theme.base,
    },
    typography: {
      fontFamily: FONT_FAMILY,
    },
  })

  const agGridTheme =
    props.theme.base === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz"

  const gridStyle = useMemo(
    () => ({
      //height: `${Math.min(42 * rowData.length, 1500)}px`, // Adjust 600 to your desired max height
      height:`${Math.min(50 * rowData.length, 1000)}px`,
      // height: "100%",
      "--ag-font-family": FONT_FAMILY,
      // minWidth: "760px",
      // maxWidth: "100%",
      // height: "1250px",
      overflow: "auto",
      margin: "auto",
    }),
    [rowData]
  )

  const autoSizeStrategy = {
    type: 'fitCellContents'
  }

  const autoGroupColumnDef = {
    // headerName: '分组别名',  // 设置分组之后列的显示名称，如果不设置，则默认显示为“Group”。
    // minWidth: 100, // 设置分组列的最小宽度，其他属性也可以设置，例如：width；maxWidth
    // sort: 'asc', // 对分组进行排序，asc是升序，desc是降序
    pinned: 'left', // 将分组列固定在左边
    cellRendererParams: {
        suppressCount: true,  // 不显示分组列右边的计数个数，如果是false，就是要统计个数
    }
  }



  let message = `${numProblems} problems selected in the current time window.`;

  if (numProblems === 0) {
    message = "No problems selected in the current time window. Please select a different time window. ";
  }
  else if (numProblems < 100) {
    message += "Less than 100 problems selected. We recommend a larger time-window to get a more accurate leaderboard.";
  }
  else {
    message += "You can change start or end date to change the time window.";
  }

  message += "<br><br>We estimate cutoff dates based on release date and performance variation. Feel free to adjust the slider to see the leaderboard at different time windows. Please offer feedback if you find any issues!"

  // console.log("rowData :", rowData)
  console.log("columnDefs :", columnDefs)
  console.log('rowData',rowData)

// display: numProblems === 0 ? "none" : "flex",
  return (
    <div className={agGridTheme} style={{ width: "100%", height: "100%" } }>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
      
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center",  height: "100%", width: "100%" }} id='flexGridWrapper'>
          <div style={{ flexGrow: "1", height: "100%", width: "100%", display: "flex", justifyContent: "center" }}> {/* Center the grid */}
            <div style={gridStyle} className={agGridTheme}>
              {/* @ts-ignore */}
              <AgGridReact
                ref={gridRef}
                rowData={rowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                domLayout="autoHeight"
                debug={true}
                // rowClassRules={rowClassRules}
                // rowSelection={"multiple"}
                enableCellTextSelection={true}
                tooltipShowDelay={0}
                autoSizeStrategy={autoSizeStrategy}
                groupDisplayType='groupRows'
                // groupDisplayType="multipleColumns" // 支持多列分组
                // groupDisplayType="singleColumn" // 单列分组显示
                groupDefaultExpanded={-1} // 默认展开所有分组
                autoGroupColumnDef={autoGroupColumnDef}
                onGridReady={(params) => {
                  params.api.sizeColumnsToFit()
                  params.api.autoSizeAllColumns(false)
                  params.api.resetRowHeights()
                }}
                onGridSizeChanged={(params) => {
                  params.api.sizeColumnsToFit()
                  params.api.autoSizeAllColumns(false)
                  params.api.resetRowHeights()
                }}
                onGridColumnsChanged={(params) => {
                  params.api.sizeColumnsToFit()
                  params.api.autoSizeAllColumns(false)
                  params.api.resetRowHeights()
                }}
                onRowDataUpdated={(params) => {
                  params.api.sizeColumnsToFit()
                  params.api.autoSizeAllColumns(false)
                  params.api.resetRowHeights()
                }}
              />
              
            </div>
          </div>
        </div>
      </div>
    </div >
  )
});

// // This line is changed from the original streamlit code
// export default withStreamlitConnection(Leaderboard)
export default Leaderboard
