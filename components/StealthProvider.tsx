"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Plus, Menu, Share2, RefreshCw, ChevronDown } from "lucide-react";

type StealthContextType = {
  isDisguised: boolean;
  setIsDisguised: (val: boolean) => void;
  toggleDisguise: () => void;
};

const StealthContext = createContext<StealthContextType | undefined>(undefined);

export function StealthProvider({ children }: { children: React.ReactNode }) {
  const [isDisguised, setIsDisguised] = useState(false);

  const toggleDisguise = () => {
    setIsDisguised((prev) => !prev);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    let lastEscPress = 0;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key twice
      if (e.key === "Escape") {
        const now = Date.now();
        if (now - lastEscPress < 500) {
          toggleDisguise();
          e.preventDefault();
        }
        lastEscPress = now;
      }
      
      // Alt + S
      if (e.altKey && e.key.toLowerCase() === "s") {
        toggleDisguise();
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update document title and favicon dynamically
  useEffect(() => {
    if (isDisguised) {
      // Save original title
      const originalTitle = document.title;
      document.title = "Q2_Sales_Projections_Final.xlsx - Google Sheets";
      
      // Save original favicon
      const favLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      const originalFav = favLink ? favLink.href : "";
      
      const sheetFav = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230F9D58'%3E%3Cpath d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'/%3E%3C/svg%3E";
      
      if (favLink) {
        favLink.href = sheetFav;
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = sheetFav;
        document.head.appendChild(link);
      }

      // Mute audio
      const audios = document.querySelectorAll("audio");
      audios.forEach((audio) => {
        audio.pause();
      });

      return () => {
        document.title = originalTitle;
        if (favLink && originalFav) {
          favLink.href = originalFav;
        }
      };
    }
  }, [isDisguised]);

  return (
    <StealthContext.Provider value={{ isDisguised, setIsDisguised, toggleDisguise }}>
      {isDisguised ? <GoogleSheetsDisguise onRestore={toggleDisguise} /> : children}
    </StealthContext.Provider>
  );
}

export function useStealth() {
  const context = useContext(StealthContext);
  if (!context) {
    throw new Error("useStealth must be used within a StealthProvider");
  }
  return context;
}

export function GoogleSheetsDisguise({ onRestore }: { onRestore: () => void }) {
  const [activeCell, setActiveCell] = useState("B4");
  const [editingValue, setEditingValue] = useState("111,100");

  const menuItems = ["File", "Edit", "View", "Insert", "Format", "Data", "Tools", "Extensions", "Help"];
  
  // Sheet column letters
  const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"];
  
  // Rows data
  const rowData = [
    { row: 1, A: "Date", B: "Channel", C: "Traffic", D: "Conversion", E: "New Users", F: "CAC", G: "LTV", H: "MRR Added" },
    { row: 2, A: "2026-05-01", B: "Organic Search", C: "45,200", D: "2.4%", E: "1,085", F: "$0.00", G: "$150.00", H: "$16,275" },
    { row: 3, A: "2026-05-02", B: "Paid Ads (Meta)", C: "12,800", D: "3.1%", E: "397", F: "$42.50", G: "$120.00", H: "$4,764" },
    { row: 4, A: "2026-05-03", B: "Referral", C: "8,400", D: "4.8%", E: "403", F: "$12.00", G: "$180.00", H: "$7,254" },
    { row: 5, A: "2026-05-04", B: "Direct", C: "22,100", D: "1.9%", E: "420", F: "$0.00", G: "$150.00", H: "$6,300" },
    { row: 6, A: "2026-05-05", B: "Newsletter", C: "15,300", D: "5.2%", E: "796", F: "$4.50", G: "$110.00", H: "$8,756" },
    { row: 7, A: "2026-05-06", B: "Influencer", C: "19,500", D: "2.8%", E: "546", F: "$28.00", G: "$135.00", H: "$7,371" },
    { row: 8, A: "2026-05-07", B: "Affiliate", C: "11,200", D: "3.5%", E: "392", F: "$15.00", G: "$140.00", H: "$5,488" },
    { row: 9, A: "Total / Avg", B: "", C: "134,500", D: "3.0%", E: "4,039", F: "$14.85", G: "$140.65", H: "$56,208" },
  ];

  // Fill up remaining rows to make it look full
  const fullRows = [...rowData];
  for (let i = 10; i <= 28; i++) {
    fullRows.push({
      row: i,
      A: "", B: "", C: "", D: "", E: "", F: "", G: "", H: ""
    });
  }

  const handleCellClick = (cellId: string, val: string) => {
    setActiveCell(cellId);
    setEditingValue(val);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#f9fbfd] text-sm text-gray-800 font-sans select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-1.5 bg-[#f9fbfd] select-none">
        <div className="flex items-center gap-3">
          {/* Green Sheet Icon */}
          <div className="cursor-pointer rounded-lg p-1 hover:bg-gray-150" onClick={onRestore} title="Go back to work">
            <svg className="h-9 w-9" viewBox="0 0 24 24" fill="#0F9D58">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 text-base leading-tight">Q2_Sales_Projections_Final.xlsx</span>
              <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 uppercase">xlsx</span>
            </div>
            
            {/* Menu options */}
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-600">
              {menuItems.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    // Click Help or File to restore chat room
                    if (item === "Help" || item === "File") {
                      onRestore();
                    }
                  }}
                  className="hover:bg-gray-100 px-1.5 py-0.5 rounded cursor-pointer transition font-normal"
                >
                  {item}
                </button>
              ))}
              <span className="text-gray-300">|</span>
              <span className="text-[11px] text-gray-400">All changes saved to Drive</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onRestore} className="flex items-center gap-1.5 rounded-full bg-emerald-100 hover:bg-emerald-250 px-4 py-1.5 text-xs font-semibold text-emerald-800 transition">
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <div className="h-8 w-8 rounded-full bg-pink-500 text-white font-bold flex items-center justify-center text-xs shadow-inner select-none">
            A
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 bg-[#f0f4f9] px-3 py-1 text-xs">
        <button className="p-1 hover:bg-gray-200 rounded" title="Undo"><svg className="h-3.5 w-3.5 fill-gray-650" viewBox="0 0 24 24"><path d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg></button>
        <button className="p-1 hover:bg-gray-200 rounded" title="Redo"><svg className="h-3.5 w-3.5 fill-gray-650" viewBox="0 0 24 24"><path d="M18.4 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 17c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 17h9V8l-3.6 2.6z"/></svg></button>
        <button className="p-1 hover:bg-gray-200 rounded" title="Print"><svg className="h-3.5 w-3.5 fill-gray-650" viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg></button>
        <span className="w-px h-4 bg-gray-300 mx-0.5" />
        <button className="px-1.5 py-0.5 hover:bg-gray-200 rounded font-bold" title="Currency">$</button>
        <button className="px-1.5 py-0.5 hover:bg-gray-200 rounded font-bold" title="Percent">%</button>
        <button className="px-1 py-0.5 hover:bg-gray-200 rounded font-mono" title="Decrease decimals">.0</button>
        <button className="px-1 py-0.5 hover:bg-gray-200 rounded font-mono" title="Increase decimals">.00</button>
        <span className="w-px h-4 bg-gray-300 mx-0.5" />
        <button className="px-2 py-0.5 hover:bg-gray-200 rounded flex items-center gap-1">Arial <ChevronDown className="h-3 w-3" /></button>
        <button className="px-2 py-0.5 hover:bg-gray-200 rounded flex items-center gap-1">10 <ChevronDown className="h-3 w-3" /></button>
        <span className="w-px h-4 bg-gray-300 mx-0.5" />
        <button className="p-1 hover:bg-gray-200 rounded font-bold" title="Bold">B</button>
        <button className="p-1 hover:bg-gray-200 rounded italic" title="Italic">I</button>
        <button className="p-1 hover:bg-gray-200 rounded line-through" title="Strikethrough">S</button>
        <button className="p-1 hover:bg-gray-200 rounded flex items-center" title="Text color"><span className="underline decoration-black decoration-2">A</span></button>
        <button className="p-1 hover:bg-gray-200 rounded" title="Fill color"><svg className="h-3.5 w-3.5 fill-gray-650" viewBox="0 0 24 24"><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.59-.59 1.54 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.58.59-1.53 0-2.12zM5.27 10.44L9.8 5.91l4.53 4.53H5.27zM12 19c-1.66 0-3-1.34-3-3 0-2 3-5.4 3-5.4s3 3.4 3 5.4c0 1.66-1.34 3-3 3z"/></svg></button>
        <button className="p-1 hover:bg-gray-200 rounded" title="Borders"><Menu className="h-3.5 w-3.5 rotate-90" /></button>
      </div>

      {/* Formula Bar */}
      <div className="flex items-center gap-1 border-b border-gray-200 bg-white px-2 py-1 text-xs">
        <div className="font-mono text-gray-500 font-bold px-3 select-text bg-gray-50 border border-gray-200 py-0.5 rounded min-w-[45px] text-center">
          {activeCell}
        </div>
        <span className="text-gray-300">|</span>
        <div className="italic text-gray-400 px-1.5 font-serif select-none">fx</div>
        <input
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          className="flex-1 font-mono outline-none border-none text-gray-800 bg-transparent px-2"
        />
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-auto bg-gray-150">
        <table className="border-collapse table-fixed w-full text-xs text-left bg-white">
          <thead>
            <tr className="bg-gray-100 text-gray-650 font-normal">
              {/* Row index column header */}
              <th className="w-10 border border-gray-200 bg-gray-100 text-center select-none py-1 sticky top-0 left-0 z-10"></th>
              {cols.map((col) => (
                <th
                  key={col}
                  className="w-24 border border-gray-200 bg-gray-100 text-center font-normal select-none py-1 sticky top-0 z-5"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fullRows.map((row) => (
              <tr key={row.row} className="hover:bg-gray-50/50">
                {/* Row Number */}
                <td className="border border-gray-200 bg-gray-100 text-center font-mono text-gray-500 py-1 sticky left-0 z-5 select-none">
                  {row.row}
                </td>
                
                {/* Columns */}
                {cols.map((col) => {
                  const cellId = `${col}${row.row}`;
                  const val = (row as any)[col] || "";
                  const isSelected = activeCell === cellId;
                  
                  return (
                    <td
                      key={col}
                      onClick={() => handleCellClick(cellId, val)}
                      className={`border border-gray-200 font-mono p-1 select-text cursor-default truncate relative h-6 ${
                        isSelected 
                          ? "ring-2 ring-emerald-500 ring-inset bg-emerald-50/20 z-2" 
                          : ""
                      } ${row.row === 1 ? "font-bold text-gray-700 bg-gray-50/50" : ""} ${
                        row.row === 9 ? "font-bold border-t-2 border-double border-gray-400 bg-gray-50" : ""
                      }`}
                    >
                      {val}
                      {/* Active cell corner indicator */}
                      {isSelected && (
                        <div className="absolute right-0 bottom-0 w-1.5 h-1.5 bg-emerald-600 border border-white cursor-se-resize"></div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheets Tabs Bottom Bar */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-3 py-1 text-xs">
        <div className="flex items-center gap-1.5">
          <button className="p-1 hover:bg-gray-150 rounded" title="Add sheet"><Plus className="h-3.5 w-3.5" /></button>
          <button className="p-1 hover:bg-gray-150 rounded" title="All sheets"><Menu className="h-3.5 w-3.5" /></button>
          
          <span className="w-px h-4 bg-gray-200 mx-1" />
          
          <div className="flex items-center">
            <button className="px-4 py-1.5 bg-emerald-50 text-emerald-700 font-bold border-t-2 border-emerald-600 border-x border-gray-200 flex items-center gap-1 shadow-sm">
              Q2 Forecast
            </button>
            <button className="px-4 py-1.5 text-gray-600 hover:bg-gray-100 flex items-center gap-1 border-r border-gray-250">
              Historical Data
            </button>
            <button className="px-4 py-1.5 text-gray-600 hover:bg-gray-100 flex items-center gap-1">
              Settings
            </button>
          </div>
        </div>
        
        {/* Bottom indicators */}
        <div className="flex items-center gap-3 text-gray-500 text-[11px]">
          <span className="cursor-pointer hover:underline" onClick={onRestore}>Double Press ESC or Alt+S to Exit</span>
          <span>|</span>
          <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Auto-sync enabled</span>
        </div>
      </div>
    </div>
  );
}
