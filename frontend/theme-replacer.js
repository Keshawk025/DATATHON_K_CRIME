import fs from 'fs';
import path from 'path';

const SRC_DIR = '/home/hp/Datathon/frontend/src';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const colorMap = [
  // Backgrounds
  { regex: /bg-slate-950(\/[0-9]+)?/g, replace: "bg-[#F5F7FA]" },
  { regex: /bg-\[#090d16\]/g, replace: "bg-[#F5F7FA]" },
  
  // Cards & Inputs
  { regex: /bg-slate-900(\/[0-9]+)?/g, replace: "bg-[#FFFFFF]" },
  { regex: /bg-slate-850(\/[0-9]+)?/g, replace: "bg-[#FFFFFF]" },
  { regex: /bg-\[#0b1220\]/g, replace: "bg-[#FFFFFF]" },
  { regex: /bg-\[#0d1527\]/g, replace: "bg-[#FFFFFF]" },
  { regex: /bg-\[#070b13\]/g, replace: "bg-[#FFFFFF]" },
  
  // Borders
  { regex: /border-slate-800(\/[0-9]+)?/g, replace: "border-[#D6DCE5]" },
  { regex: /border-slate-700(\/[0-9]+)?/g, replace: "border-[#D6DCE5]" },
  { regex: /border-slate-850(\/[0-9]+)?/g, replace: "border-[#D6DCE5]" },
  { regex: /border-indigo-500(\/[0-9]+)?/g, replace: "border-[#0B3D91]" },
  { regex: /border-indigo-400(\/[0-9]+)?/g, replace: "border-[#0B3D91]" },
  { regex: /focus:border-indigo-500(\/[0-9]+)?/g, replace: "focus:border-[#0B3D91] focus:ring-4 focus:ring-[#0B3D91]/25" },
  
  // Text Colors
  { regex: /text-white/g, replace: "text-[#1C2833]" },
  { regex: /text-slate-100/g, replace: "text-[#1C2833]" },
  { regex: /text-slate-200/g, replace: "text-[#1C2833]" },
  { regex: /text-slate-300/g, replace: "text-[#1C2833]" },
  { regex: /text-slate-400/g, replace: "text-[#5F6B7A]" },
  { regex: /text-slate-500/g, replace: "text-[#5F6B7A]" },
  { regex: /text-slate-600/g, replace: "text-[#8D99A6]" },
  { regex: /text-slate-450/g, replace: "text-[#5F6B7A]" },
  { regex: /text-slate-350/g, replace: "text-[#1C2833]" },
  
  // Indigo Text -> Government Blues
  { regex: /text-indigo-400/g, replace: "text-[#0B3D91]" },
  { regex: /text-indigo-500/g, replace: "text-[#1E5AA8]" },
  { regex: /text-indigo-300/g, replace: "text-[#1E5AA8]" },
  { regex: /text-indigo-600/g, replace: "text-[#0F2747]" },

  // Buttons & Bgs
  { regex: /bg-indigo-500(\/[0-9]+)?/g, replace: "bg-[#1E5AA8]" },
  { regex: /bg-indigo-600(\/[0-9]+)?/g, replace: "bg-[#0B3D91]" },
  { regex: /hover:bg-indigo-500(\/[0-9]+)?/g, replace: "hover:bg-[#154A9E] hover:shadow-md transition-all duration-150" },
  { regex: /hover:bg-indigo-400(\/[0-9]+)?/g, replace: "hover:bg-[#1E5AA8] transition-all duration-150" },
  { regex: /hover:bg-slate-800/g, replace: "hover:bg-[#F5F7FA] transition-all duration-150" },
  { regex: /hover:bg-slate-850/g, replace: "hover:bg-[#F5F7FA] transition-all duration-150" },
  { regex: /hover:bg-slate-900/g, replace: "hover:bg-[#F5F7FA] transition-all duration-150" },
  
  // Gradients (Remove completely)
  { regex: /bg-gradient-to-b[rl]?\s+from-[^\s]+\s+((via-[^\s]+\s+)?to-[^\s]+)?/g, replace: "bg-[#FFFFFF]" },
  { regex: /from-indigo-500\s+to-indigo-700/g, replace: "" },
  { regex: /from-indigo-500\s+via-indigo-600\s+to-purple-600/g, replace: "" },
  { regex: /from-indigo-500\s+via-indigo-600\s+to-indigo-800/g, replace: "" },
  { regex: /from-indigo-500\s+via-indigo-600\s+to-indigo-900/g, replace: "" },

  // Shadows
  { regex: /shadow-lg\s+shadow-indigo-500\/20/g, replace: "shadow-[0_4px_12px_rgba(0,0,0,0.10)]" },
  { regex: /shadow-xl\s+shadow-indigo-500\/20/g, replace: "shadow-[0_4px_12px_rgba(0,0,0,0.10)]" },
  { regex: /shadow-md/g, replace: "shadow-[0_2px_8px_rgba(0,0,0,0.08)]" },
  { regex: /shadow-lg/g, replace: "shadow-[0_4px_12px_rgba(0,0,0,0.10)]" },
  { regex: /shadow-2xl/g, replace: "shadow-[0_4px_12px_rgba(0,0,0,0.10)]" },

  // Animations & Glassmorphism
  { regex: /backdrop-blur-[a-z]+/g, replace: "" },
  { regex: /animate-pulse/g, replace: "" },
  { regex: /animate-bounce/g, replace: "" },
  { regex: /animate-shake/g, replace: "" },
  { regex: /hover:-translate-y-0\.5/g, replace: "" },
  { regex: /hover:scale-105/g, replace: "" },
  { regex: /transition-transform/g, replace: "transition-all duration-150" },
];

walkDir(SRC_DIR, (filePath) => {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  
  colorMap.forEach(({ regex, replace }) => {
    content = content.replace(regex, replace);
  });
  
  // Fix Buttons explicitly to have white text instead of text-[#1C2833]
  content = content.replace(/(bg-\[#0B3D91\][^>]*?)(text-\[#1C2833\])/g, '$1text-white');
  content = content.replace(/(bg-\[#1E5AA8\][^>]*?)(text-\[#1C2833\])/g, '$1text-white');
  
  // Fix specific known buttons like Login
  content = content.replace(/className="w-full bg-\[#0B3D91\] text-\[#1C2833\]/g, 'className="w-full bg-[#0B3D91] text-white');
  content = content.replace(/className="w-full flex items-center justify-center gap-2 bg-\[#0B3D91\] text-\[#1C2833\]/g, 'className="w-full flex items-center justify-center gap-2 bg-[#0B3D91] text-white');

  // Also fix Recharts custom styling
  content = content.replace(/backgroundColor: '#0f172a'/g, "backgroundColor: '#FFFFFF'");
  content = content.replace(/border: '1px solid #1e293b'/g, "border: '1px solid #D6DCE5'");

  // Replace border for inputs explicitly
  content = content.replace(/border-\[#D6DCE5\] rounded-lg px-3.5 py-3 text-\[#1C2833\]/g, 'border-[#C7D0DA] rounded-lg px-3.5 py-3 text-[#1C2833] hover:border-[#1E5AA8] transition-colors duration-150');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
});
