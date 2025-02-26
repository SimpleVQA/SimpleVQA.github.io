import { useCallback, useMemo, useRef, useState } from "react";
import { render } from "react-dom";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  ColDef,
  ColGroupDef,
  GetDataPath,
  Grid,
  GridOptions,
} from "ag-grid-community";
import { getData } from "./data";

const TreeData = () => {
  const gridRef = useRef<AgGridReact>(null);
  const containerStyle = useMemo(
    () => ({ width: "100%", height: "600px" }),
    []
  );
  const gridStyle = useMemo(() => ({ height: "100%", width: "100%" }), []);
  const [rowData, setRowData] = useState<any[]>(getData());
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    // we're using the auto group column by default!
    { field: "商材名" },
    { field: "ジャンル" },
    { field: "再生回数" },
  ]);
  const defaultColDef = useMemo<ColDef>(() => {
    return {
      flex: 1,
    };
  }, []);
  const autoGroupColumnDef = useMemo<ColDef>(() => {
    return {
      headerName: "管理番号",
      minWidth: 300,
      cellRendererParams: {
        suppressCount: true,
      },
    };
  }, []);

  const getDataPath = useMemo<GetDataPath>(() => {
    return (data: any) => {
      if (Array.isArray(data.controlNumber)) {
        return data.controlNumber;
      } else {
        return [data.controlNumber];
      }
    };
  }, []);

  const onFilterTextBoxChanged = useCallback(() => {
    gridRef.current!.api.setQuickFilter(
      (document.getElementById("filter-text-box") as any).value
    );
  }, []);

  return (
    <div style={containerStyle}>
      <div className="example-wrapper">
        <div style={{ marginBottom: "5px" }}>
          <input
            type="text"
            id="filter-text-box"
            placeholder="Filter..."
            onInput={onFilterTextBoxChanged}
          />
        </div>

        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            autoGroupColumnDef={autoGroupColumnDef}
            treeData={true}
            animateRows={true}
            groupDefaultExpanded={-1}
            getDataPath={getDataPath}
          ></AgGridReact>
        </div>
      </div>
    </div>
  );
};

export default TreeData;
