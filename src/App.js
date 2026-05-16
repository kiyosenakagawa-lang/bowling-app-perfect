import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, Plus, Trash2, Edit, Loader2, ExternalLink, AlertTriangle, ZoomIn, ZoomOut } from 'lucide-react';

// カスタムフック: ローカルストレージでのデータ保存
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
}

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県", "全日本学生"
];

const MAKERS = [
  "900 Global", "ABS", "Brunswick", "Columbia 300", "Denver Bowling", "DV8",
  "Ebonite", "Elite", "Genesis Bowling", "Hammer", "HI-SP", "Legends",
  "Lord Field", "Motiv", "NIPPON Ebonite", "PBS (Professionsl Bowling System)",
  "Phiten", "Pro Bowl", "Pyramid Bowling", "Radical", "Roto Grip",
  "Round1 Gear", "Seismic", "Storm", "Superbowl", "Swag", "Track",
  "Visionary", "X-ATK"
];

export default function App() {
  const [activeTab, setActiveTab] = useState('input');
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  
  const [profile, setProfile] = useLocalStorage('bowling_profile_v4', {
    name: '', kana: '', handedness: '', affiliation: '',
    jbNo1: '', jbNo2: '', jbNo3: '',
    isSpecialMember: false, isOver600: false
  });
  
  const [balls, setBalls] = useLocalStorage('bowling_balls_v4', []);
  
  const [eventData, setEventData] = useLocalStorage('bowling_event_v4', {
    eventName: '', date: '', submitNo: '1',
    selectedBallIds: ["", "", "", "", "", ""]
  });

  const [newBall, setNewBall] = useState({ maker: '', name: '', serialNo: '', validDate: '' });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportMode, setIsExportMode] = useState(false);
  const [message, setMessage] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1); // ズーム倍率の状態

  // ブラウザ検知と初期ズーム設定
  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isInApp = /line|fbav|facebook|instagram|twitter|twitter|micromessenger/i.test(ua);
    setIsInAppBrowser(isInApp);

    // スマホ等で画面幅が小さい場合、初期ズームを50%にする
    if (window.innerWidth < 800) {
      setZoomLevel(0.5);
    }
  }, []);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile({ ...profile, [name]: type === 'checkbox' ? checked : value });
  };

  const handleEventChange = (e) => {
    const { name, value } = e.target;
    setEventData({ ...eventData, [name]: value });
  };

  const handleAddBall = (e) => {
    e.preventDefault();
    if (!newBall.name) return;
    setBalls([...balls, { ...newBall, id: Date.now().toString() }]);
    setNewBall({ maker: '', name: '', serialNo: '', validDate: '' });
  };

  const handleDeleteBall = (id) => {
    setBalls(balls.filter(b => b.id !== id));
    const newIds = eventData.selectedBallIds.map(ballId => ballId === id ? "" : ballId);
    setEventData({ ...eventData, selectedBallIds: newIds });
  };

  const handleUpdateBall = (id, field, value) => {
    setBalls(balls.map(ball => ball.id === id ? { ...ball, [field]: value } : ball));
  };

  // ズーム操作のハンドラー
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.3));

  const renderDate = (dateStr) => {
    if(!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return (
      <React.Fragment>
        <span className="gothic text-[15px]">{y}</span>
        <span className="mincho mx-0.5 text-[13px]">年</span>
        <span className="gothic text-[15px]">{parseInt(m, 10)}</span>
        <span className="mincho mx-0.5 text-[13px]">月</span>
        <span className="gothic text-[15px]">{parseInt(d, 10)}</span>
        <span className="mincho ml-0.5 text-[13px]">日</span>
      </React.Fragment>
    );
  };

  const renderDateTwoLines = (dateStr) => {
    if(!dateStr) return null;
    const [y, m, d] = dateStr.split('-');
    return (
      <div className="flex flex-col justify-center leading-tight py-0.5 w-full px-2">
        <div className="mb-0.5 text-center">
          <span className="gothic text-[13px]">{y}</span>
          <span className="mincho mx-0.5 text-[10px]">年</span>
        </div>
        <div className="text-right">
          <span className="gothic text-[13px]">{parseInt(m, 10)}</span>
          <span className="mincho mx-0.5 text-[10px]">月</span>
          <span className="gothic text-[13px]">{parseInt(d, 10)}</span>
          <span className="mincho ml-0.5 text-[10px]">日</span>
        </div>
      </div>
    );
  };

  // セル幅に収めるためのフォントサイズ自動調整関数
  const getAutoFontSize = (text, baseSize, maxFullWidthChars) => {
    if (!text) return `${baseSize}px`;
    let w = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      // 半角英数字・記号は幅を狭く見積もる
      if (code >= 0x0020 && code <= 0x007E) {
        if (/[A-Z@]/.test(text[i])) w += 0.7;
        else if (/[mvw]/.test(text[i])) w += 0.75;
        else if (/[ijl1\.\,]/.test(text[i])) w += 0.35;
        else w += 0.55;
      } else {
        w += 1; // 全角文字
      }
    }
    if (w <= maxFullWidthChars) return `${baseSize}px`;
    const scale = maxFullWidthChars / w;
    return `${Math.max(baseSize * scale, 6)}px`; // 最小サイズを6pxに制限
  };

  const executePdfAction = async (action = 'download') => {
    let printWindow = null;
    
    if (action === 'print') {
      printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html lang="ja"><head><title>印刷プレビュー</title></head><body style="text-align:center; padding-top: 50px; font-family: sans-serif; color: #555;">印刷用データ（PDF）を準備しています。<br/>しばらくお待ちください...</body></html>');
      } else {
        showMessage('ポップアップがブロックされました。ブラウザの設定で許可してください。');
        return;
      }
    }

    setIsGeneratingPdf(true);
    setIsExportMode(true);
    
    setTimeout(async () => {
      try {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

        const element = document.getElementById('pdf-content');
        if (document.fonts) await document.fonts.ready;

        const canvas = await window.html2canvas(element, { 
          scale: 4, 
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: true,
          onclone: (clonedDoc) => {
            const clonedContent = clonedDoc.getElementById('pdf-content');

            // --- 印刷時の線の重なり（太くなる問題）を完全に防ぐ処理 ---
            const tables = clonedContent.querySelectorAll('table');
            tables.forEach(table => {
              table.style.setProperty('border-collapse', 'separate', 'important');
              table.style.setProperty('border-spacing', '0', 'important');
              table.style.setProperty('border', 'none', 'important');
            });

            // 全セルの内枠線を大会名下線と同じ太さ（1px）にする。重なりを防ぐため右と下だけ引く
            const allCells = clonedContent.querySelectorAll('td, th');
            allCells.forEach(cell => {
              cell.style.setProperty('border-top', 'none', 'important');
              cell.style.setProperty('border-left', 'none', 'important');
              cell.style.setProperty('border-right', '1px solid #000', 'important');
              cell.style.setProperty('border-bottom', '1px solid #000', 'important');
            });
            
            // 外枠があるテーブルに対する処理
            const borderTables = clonedContent.querySelectorAll('.outer-border, .thin-border-table');
            borderTables.forEach(table => {
              const isOuter = table.classList.contains('outer-border');
              if (isOuter) {
                table.style.setProperty('border-top', '1.5px solid #000', 'important');
                table.style.setProperty('border-left', '1.5px solid #000', 'important');
                table.style.setProperty('border-bottom', '1.5px solid #000', 'important');
                table.style.setProperty('border-right', '1.5px solid #000', 'important');
              } else {
                // 細い枠線のテーブルは、右と下の線をセルの線に任せることで重なり(太くなる現象)を防ぐ
                table.style.setProperty('border-top', '1px solid #000', 'important');
                table.style.setProperty('border-left', '1px solid #000', 'important');
                table.style.setProperty('border-bottom', 'none', 'important');
                table.style.setProperty('border-right', 'none', 'important');
              }

              const rows = table.querySelectorAll('tr');
              if (rows.length > 0) {
                if (isOuter) {
                  // セルの右・下の線が、テーブル全体の枠線と重ならないように消す
                  rows.forEach(row => {
                    const cells = row.children;
                    if (cells.length > 0) {
                      cells[cells.length - 1].style.setProperty('border-right', 'none', 'important');
                    }
                  });
                  const lastRowCells = rows[rows.length - 1].children;
                  Array.from(lastRowCells).forEach(cell => {
                    cell.style.setProperty('border-bottom', 'none', 'important');
                  });
                }
              }
            });
            // -----------------------------------------------------------

            const cellsContent = clonedContent.querySelectorAll('.cell-content');
            cellsContent.forEach(cell => {
              cell.style.transform = 'translateY(-5.5px)'; 
            });
            const spans = clonedContent.querySelectorAll('span');
            spans.forEach(span => {
              if(!span.closest('.cell-content')){
                span.style.transform = 'translateY(-4px)';
              }
            });
            const tournamentNameText = clonedContent.querySelector('.tournament-name-text');
            if (tournamentNameText) {
              tournamentNameText.style.transform = 'translateY(-6px)';
            }

            // 注意書きと矢印のコンテナを上にずらしてプレビューと同じ高さに合わせる
            const noticeContainer = clonedContent.querySelector('.notice-container');
            if (noticeContainer) {
              noticeContainer.style.transform = 'translateY(-6px)';
            }

            const selects = clonedDoc.querySelectorAll('select');
            selects.forEach(select => {
              const text = select.options[select.selectedIndex].text;
              const parent = select.parentNode;
              const textNode = clonedDoc.createElement('div');
              textNode.innerText = (text === "（クリックして選択）" || text === "選択") ? "" : text;
              textNode.className = select.className;
              // 縮小されたフォントサイズを引き継ぐ
              textNode.style.cssText = select.style.cssText;
              textNode.style.display = 'inline-block';
              textNode.style.width = '100%';
              textNode.style.textAlign = 'center';
              textNode.style.background = 'transparent';
              textNode.style.lineHeight = '1.2';
              textNode.style.transform = 'translateY(-5.5px)';
              parent.replaceChild(textNode, select);
            });
          }
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let imgWidth = pdfWidth;
        let imgHeight = (canvas.height * pdfWidth) / canvas.width;
        if (imgHeight > pageHeight) {
          const ratio = pageHeight / imgHeight;
          imgWidth = imgWidth * ratio;
          imgHeight = imgHeight * ratio;
        }
        pdf.addImage(imgData, 'JPEG', (pdfWidth - imgWidth) / 2, 0, imgWidth, imgHeight, undefined, 'FAST');
        
        if (action === 'download') {
          pdf.save(eventData.eventName ? `使用ボール登録証_${eventData.eventName}.pdf` : '使用ボール登録証.pdf');
        } else if (action === 'print') {
          pdf.autoPrint();
          if (printWindow) printWindow.location.href = pdf.output('bloburl');
        }
      } catch (error) {
        console.error(error);
        showMessage("処理に失敗しました。");
        if (printWindow) printWindow.close();
      } finally {
        setIsExportMode(false);
        setIsGeneratingPdf(false);
      }
    }, 1200); 
  };

  const handlePrint = () => executePdfAction('print');
  const handlePdfDownload = () => executePdfAction('download');

  const selectedCount = eventData.selectedBallIds.filter(id => id !== "").length;
  const getFee = (count, profile) => {
    if (count <= 1) return 0;
    const fees = {
      general:       [0, 0, 500, 1000, 1500, 3000, 4500, 6000, 7500, 9000, 10500, 12000, 13500],
      special:       [0, 0,   0,    0,  500, 2000, 3500, 5000, 6500, 8000,  9500, 11000, 12500],
      over600:       [0, 0, 500, 1000, 1500, 2000, 2500, 3000, 4500, 6000,  7500,  9000, 10500],
      specialAnd600: [0, 0,   0,    0,  500, 1000, 1500, 2000, 3500, 5000,  6500,  8000,  9500]
    };
    let type = 'general';
    if (profile.isSpecialMember && profile.isOver600) type = 'specialAnd600';
    else if (profile.isSpecialMember) type = 'special';
    else if (profile.isOver600) type = 'over600';
    return count <= 12 ? fees[type][count] : fees[type][12];
  };
  const totalFee = getFee(selectedCount, profile);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans pb-20 print:pb-0 print:bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap');

        /* スマホ等で文字が勝手に拡大されてレイアウトが崩れるのを防ぐ */
        html, body {
          -webkit-text-size-adjust: 100%;
          text-size-adjust: 100%;
        }

        .yellow-cell { background-color: ${isExportMode ? 'transparent' : '#fff2cc'} !important; }
        
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { background-color: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-hidden { display: none !important; }
          .yellow-cell { background-color: transparent !important; }
          .print-hide-placeholder { color: transparent !important; }
        }
        
        .cell-content {
          display: inline-block;
          vertical-align: middle;
          width: 100%;
          box-sizing: border-box;
          line-height: 1.2 !important;
          text-align: center;
          padding: 0 !important;
          margin: 0 !important;
        }

        .outer-border {
          border: 1.5px solid #000 !important;
          border-collapse: collapse !important;
        }

        /* 外線も内線も細いテーブル用 */
        .thin-border-table {
          border: 1px solid #000 !important;
          border-collapse: collapse !important;
        }

        td, th {
          padding: 0 !important;
          vertical-align: middle !important;
          text-align: center;
          border: 1px solid #000 !important;
          background-clip: padding-box; /* 罫線の上に背景色が重ならないようにする */
        }

        table {
          border-collapse: collapse !important;
        }

        .mincho { font-family: "MS PMincho", "MS Mincho", "Hiragino Mincho Pro", serif; }
        .gothic { font-family: "Noto Sans JP", "MS PGothic", "MS Gothic", "Hiragino Kaku Gothic ProN", sans-serif; }
        .font-meiryo { font-family: "Meiryo", "メイリオ", sans-serif; }
        
        .preview-select {
          appearance: none;
          -webkit-appearance: none;
          background: transparent;
          border: none;
          outline: none;
          width: 100%;
          height: 100%;
          cursor: pointer;
          text-align: center;
          text-align-last: center;
          font-weight: normal;
          padding: 0;
          margin: 0;
        }
        .preview-select:focus { outline: none; }
      `}</style>

      {/* インアプリブラウザへの警告バナー */}
      {isInAppBrowser && (
        <div className="bg-orange-500 text-white p-3 text-sm font-bold flex items-center justify-between sticky top-0 z-50 shadow-lg print:hidden">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
            <span>PDF作成にはブラウザ（Safari/Chrome等）が必要です</span>
          </div>
          <button 
            onClick={() => showMessage("メニューから「ブラウザで開く」を選択してください")}
            className="bg-white text-orange-500 px-3 py-1 rounded-full text-xs whitespace-nowrap ml-2 shadow-sm"
          >
            やり方
          </button>
        </div>
      )}

      {message && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce text-sm">
          {message}
        </div>
      )}

      <header className={`bg-[#1f4e79] text-white p-4 shadow-md print-hidden sticky ${isInAppBrowser ? 'top-[44px]' : 'top-0'} z-10 flex justify-center items-center`}>
        <h1 className="text-lg sm:text-xl font-bold mincho tracking-widest text-center">JBボール登録証</h1>
      </header>

      <main className="max-w-4xl mx-auto p-4 print:p-0">
        <div className={activeTab === 'input' ? 'block print-hidden' : 'hidden print-hidden'}>
          <div className="space-y-6">
            <section className="bg-white p-5 rounded-xl shadow-sm">
              <h2 className="text-lg font-bold border-b pb-2 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">1</span> 大会設定
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">大会名</label>
                  <input type="text" name="eventName" className="w-full border-gray-300 rounded-lg p-2 border focus:ring-blue-500 bg-[#fff2cc] font-meiryo" value={eventData.eventName} onChange={handleEventChange} placeholder="第〇回〇〇〇〇〇大会" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">右上のNo.</label>
                  <input type="text" name="submitNo" className="w-full border-gray-300 rounded-lg p-2 border focus:ring-blue-500 font-meiryo" value={eventData.submitNo} onChange={handleEventChange} />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-bold text-gray-700 mb-1">日付</label>
                  <input type="date" name="date" className="w-full sm:w-1/3 border-gray-300 rounded-lg p-2 border focus:ring-blue-500 bg-[#fff2cc] font-meiryo" value={eventData.date} onChange={handleEventChange} />
                </div>
              </div>
            </section>

            <section className="bg-white p-5 rounded-xl shadow-sm">
              <h2 className="text-lg font-bold border-b pb-2 mb-4 flex items-center">
                <span className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">2</span> 基本情報
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-1">ふりがな</label><input type="text" name="kana" className="w-full border-gray-300 rounded-lg p-2 border font-meiryo" value={profile.kana} onChange={handleProfileChange} /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">氏名</label><input type="text" name="name" className="w-full border-gray-300 rounded-lg p-2 border font-meiryo" value={profile.name} onChange={handleProfileChange} /></div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">利き手</label>
                  <select name="handedness" className="w-full border-gray-300 rounded-lg p-2 border font-meiryo bg-white" value={profile.handedness} onChange={handleProfileChange}>
                    <option value="">選択</option><option value="右">右</option><option value="左">左</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">所属</label>
                  <select name="affiliation" className="w-full border-gray-300 rounded-lg p-2 border font-meiryo bg-white" value={profile.affiliation} onChange={handleProfileChange}>
                    <option value="">選択</option>
                    {PREFECTURES.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">JB No.</label>
                  <div className="flex items-center gap-2">
                    <input type="text" name="jbNo1" className="w-16 border border-gray-300 rounded p-2 text-center" value={profile.jbNo1} onChange={handleProfileChange} maxLength="4" /><span>-</span>
                    <input type="text" name="jbNo2" className="w-16 border border-gray-300 rounded p-2 text-center" value={profile.jbNo2} onChange={handleProfileChange} maxLength="4" /><span>-</span>
                    <input type="text" name="jbNo3" className="w-24 border border-gray-300 rounded p-2 text-center" value={profile.jbNo3} onChange={handleProfileChange} maxLength="8" />
                  </div>
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-6 mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <label className="flex items-center cursor-pointer select-none"><input type="checkbox" name="isSpecialMember" className="w-5 h-5 rounded border-gray-300 text-blue-600 mr-2" checked={profile.isSpecialMember} onChange={handleProfileChange} /><span className="text-sm font-bold text-gray-700">特別会員</span></label>
                  <label className="flex items-center cursor-pointer select-none"><input type="checkbox" name="isOver600" className="w-5 h-5 rounded border-gray-300 text-blue-600 mr-2" checked={profile.isOver600} onChange={handleProfileChange} /><span className="text-sm font-bold text-gray-700">公認ゲーム600ゲーム以上</span></label>
                </div>
              </div>
            </section>

            <section className="bg-white p-5 rounded-xl shadow-sm border-l-4 border-[#1f4e79]">
              <h2 className="text-lg font-bold border-b pb-2 mb-4 flex items-center text-[#1f4e79]">
                <span className="bg-[#1f4e79] text-white w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm">3</span> 登録ボールリスト
              </h2>
              <form onSubmit={handleAddBall} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 bg-gray-50 p-4 rounded-lg border">
                <div>
                  <label className="block text-[10px] text-gray-500 mb-0.5">メーカー名</label>
                  <input list="maker-list" type="text" className="w-full border rounded p-2 font-meiryo" value={newBall.maker} onChange={e => setNewBall({...newBall, maker: e.target.value})} placeholder="メーカー名" />
                  <datalist id="maker-list">
                    {MAKERS.map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>
                <div><label className="block text-[10px] text-gray-500 mb-0.5">ボール名</label><input required type="text" className="w-full border rounded p-2 font-meiryo" value={newBall.name} onChange={e => setNewBall({...newBall, name: e.target.value})} placeholder="ボール名" /></div>
                <div><label className="block text-[10px] text-gray-500 mb-0.5">ボールNo.</label><input type="text" className="w-full border rounded p-2 font-meiryo" value={newBall.serialNo} onChange={e => setNewBall({...newBall, serialNo: e.target.value})} placeholder="ボールNo." /></div>
                <div><label className="block text-[10px] text-gray-500 mb-0.5">有効期限開始日</label><input type="date" className="w-full border rounded p-2" value={newBall.validDate} onChange={e => setNewBall({...newBall, validDate: e.target.value})} /></div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <button type="submit" className="w-full bg-[#1f4e79] text-white font-bold py-2 rounded flex items-center justify-center hover:bg-blue-900 transition-colors"><Plus className="w-4 h-4 mr-1" /> ボールをリストに追加</button>
                </div>
              </form>
              <div className="space-y-2 overflow-visible pb-4">
                {balls.map(ball => {
                  let isExpired = false;
                  if (ball.validDate) {
                    const validDate = new Date(ball.validDate);
                    const expiredDate = new Date(validDate.getFullYear() + 1, validDate.getMonth(), validDate.getDate());
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    if (expiredDate < today) isExpired = true;
                  }
                  return (
                    <div key={ball.id} className="flex items-start justify-between p-3 border rounded bg-white gap-2">
                      <div className="flex-grow space-y-2">
                        <div className="flex gap-2">
                          <input list="maker-list" type="text" value={ball.maker || ''} onChange={(e) => handleUpdateBall(ball.id, 'maker', e.target.value)} className="w-1/3 border rounded p-1 text-sm bg-gray-50 font-meiryo focus:bg-white focus:ring-1" placeholder="メーカー" />
                          <input type="text" value={ball.name} onChange={(e) => handleUpdateBall(ball.id, 'name', e.target.value)} className="w-2/3 border rounded p-1 text-sm font-bold bg-gray-50 font-meiryo focus:bg-white focus:ring-1" placeholder="ボール名" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 whitespace-nowrap">No.:</span>
                          <input type="text" value={ball.serialNo} onChange={(e) => handleUpdateBall(ball.id, 'serialNo', e.target.value)} className="flex-grow border rounded p-1 text-sm bg-gray-50 font-meiryo focus:bg-white focus:ring-1" placeholder="ボールNo." />
                        </div>
                        <div className="flex items-center text-xs">
                          <span className="text-gray-500 mr-2 whitespace-nowrap">期限開始日:</span>
                          <input type="date" value={ball.validDate} onChange={(e) => handleUpdateBall(ball.id, 'validDate', e.target.value)} className="border rounded px-1 py-0.5 mr-2 bg-gray-50 focus:bg-white focus:ring-1" />
                          {isExpired && <span className="text-red-500 font-bold">期限切れ</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteBall(ball.id)} className="text-red-500 p-2 hover:bg-red-50 rounded shrink-0 transition-colors mt-2"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        <div className={activeTab === 'preview' ? 'block print:block' : 'hidden print:block'}>
          <div className="print-hidden mb-3 text-sm text-gray-600 bg-blue-50 border border-blue-200 p-3 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center self-start md:self-auto"><FileText className="w-5 h-5 mr-2 text-blue-500 shrink-0" /><span>メニューからブラウザで開いて印刷して下さい。</span></div>
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
              {/* 拡大・縮小コントローラー */}
              <div className="flex items-center bg-white border border-gray-300 rounded shadow-sm">
                <button onClick={handleZoomOut} disabled={zoomLevel <= 0.3} className="p-1.5 text-gray-600 hover:text-blue-600 disabled:opacity-30 border-r border-gray-200"><ZoomOut className="w-4 h-4" /></button>
                <span className="text-xs font-bold w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={handleZoomIn} disabled={zoomLevel >= 2.0} className="p-1.5 text-gray-600 hover:text-blue-600 disabled:opacity-30 border-l border-gray-200"><ZoomIn className="w-4 h-4" /></button>
              </div>
              {/* 印刷・PDFボタン */}
              <div className="flex gap-2 shrink-0">
                <button onClick={handlePrint} disabled={isGeneratingPdf} className="bg-white text-[#1f4e79] border border-[#1f4e79] px-4 py-1.5 rounded text-sm font-bold shadow hover:bg-gray-100 flex items-center disabled:opacity-50">{isGeneratingPdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Printer className="w-4 h-4 mr-1" />} 印刷</button>
                <button onClick={handlePdfDownload} disabled={isGeneratingPdf} className="bg-emerald-600 text-white px-4 py-1.5 rounded text-sm font-bold shadow hover:bg-emerald-700 flex items-center disabled:opacity-50">{isGeneratingPdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />} PDF化</button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto w-full bg-gray-300 p-2 sm:p-8 rounded-xl shadow-inner print:p-0 print:bg-white print:overflow-visible print:shadow-none">
            <div className="w-max mx-auto print:w-full">
              <div 
                style={{ 
                  width: isExportMode ? '800px' : `${800 * zoomLevel}px`,
                  height: isExportMode ? 'auto' : `${1131 * zoomLevel}px`,
                  transition: 'width 0.2s, height 0.2s'
                }}
                className="print:!w-full print:!h-auto"
              >
                <div 
                  style={{ 
                    transform: isExportMode ? 'none' : `scale(${zoomLevel})`, 
                    transformOrigin: 'top left',
                    width: '800px',
                    minHeight: '1131px',
                    transition: 'transform 0.2s'
                  }}
                  className="bg-white shadow-xl print:transform-none print:!w-full print:!min-h-0 print:shadow-none"
                >
                  <div id="pdf-content" className="mincho w-full h-full text-black relative box-border py-[38px] px-[57px]">
                    
                    <div className="mb-2">
                      <div className="flex justify-end mb-1"><div className="flex items-end text-[11px] w-24 justify-between px-1 border-b border-black pb-0.5"><span>No.</span><span className="text-center gothic flex-grow h-[15px] flex items-center justify-center">{eventData.submitNo}</span></div></div>
                      <div className="flex items-end border-b border-black"><span className="text-[18px] mr-1 shrink-0 mb-0.5">大会名：</span><div className="flex-grow flex flex-col justify-end relative h-[30px]"><div className="tournament-name-text text-center gothic text-[22px] whitespace-nowrap pb-1 leading-none h-full flex items-center justify-center">{eventData.eventName || '\u00A0'}</div></div></div>
                      <div className="flex justify-end mt-1"><span className="text-[13px]">{renderDate(eventData.date)}</span></div>
                    </div>

                    <div className="flex flex-col items-center justify-center mb-1 mt-1"><h1 className="text-[24px] text-black font-bold whitespace-nowrap"><span className="border-b border-black pb-1 inline-block tracking-[0.4em]" style={{ marginRight: '-0.4em' }}>使用ボール登録証</span></h1></div>

                    <div className="flex gap-2 mb-4 items-end">
                      <div className="flex-grow">
                        <div className="h-[1.2rem]"></div>
                        <table className="outer-border w-full text-sm table-fixed">
                          <colgroup><col className="w-[12%]"/><col className="w-[28%]"/><col className="w-[9%]"/><col className="w-[9%]"/><col className="w-[42%]"/></colgroup>
                          <tbody>
                            <tr className="h-[40px]">
                              <td className="p-0"><div className="cell-content text-[11px] whitespace-nowrap">ふりがな</div></td>
                              <td className="p-0"><div className="cell-content gothic text-[10px] px-1">{profile.kana}</div></td>
                              <td className="p-0"><div className="cell-content text-[11px] whitespace-nowrap">利き手</div></td>
                              <td className="p-0"><div className="cell-content text-[11px] whitespace-nowrap">所 属</div></td>
                              <td className="p-0"><div className="flex items-center justify-between w-full h-full px-2"><div className="flex-grow flex items-center justify-center gothic text-[15px] h-full">{profile.affiliation}</div><div className="shrink-0 text-[10px] flex items-center h-full">ボウリング連盟(連合)</div></div></td>
                            </tr>
                            <tr className="h-[40px]">
                              <td className="p-0"><div className="cell-content text-[13px] whitespace-nowrap">氏 名</div></td>
                              <td className="p-0"><div className="cell-content gothic text-[15px] px-1">{profile.name}</div></td>
                              <td className="p-0"><div className="cell-content gothic text-[12px]">{profile.handedness}</div></td>
                              <td className="p-0"><div className="cell-content text-[13px] whitespace-nowrap">JB No.</div></td>
                              <td className="p-0"><div className="cell-content gothic text-[15px] tracking-[0.2em] ml-[0.1em]"><span className="w-8 text-center">{profile.jbNo1}</span><span className="mx-1 mincho">－</span><span className="w-8 text-center">{profile.jbNo2}</span><span className="mx-1 mincho">－</span><span className="w-16 text-center">{profile.jbNo3}</span></div></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="w-[140px] shrink-0 flex flex-col ml-1 relative">
                        <div className="absolute -top-[1.2rem] w-full text-[10px] text-center">該当者は〇をつけて下さい</div>
                        <table className="outer-border w-full text-xs text-center table-fixed">
                          <colgroup><col className="w-[50%]"/><col className="w-[50%]"/></colgroup>
                          <tbody>
                            <tr className="h-[40px]"><td className="p-0"><div className="cell-content text-[10px]">特別会員</div></td><td className="p-0"><div className="cell-content text-[22px] gothic leading-none h-full">{profile.isSpecialMember ? '○' : ''}</div></td></tr>
                            <tr className="h-[40px]"><td className="p-0"><div className="cell-content text-[10px] leading-tight">公認ゲーム<br/>600ゲーム<br/>以上</div></td><td className="p-0"><div className="cell-content text-[22px] gothic leading-none h-full">{profile.isOver600 ? '○' : ''}</div></td></tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <table className="outer-border w-full text-[10px] mb-1 table-fixed">
                      <colgroup><col className="w-[4%]"/><col className="w-[20%]"/><col className="w-[30%]"/><col className="w-[22%]"/><col className="w-[12%]"/><col className="w-[6%]"/><col className="w-[6%]"/></colgroup>
                      <thead>
                        <tr className="h-[20px] text-[10px]">
                          <th className="p-0 font-normal"></th>
                          <th className="p-0 font-normal"><div className="cell-content">メーカー名</div></th>
                          <th className="p-0 font-normal"><div className="cell-content">ボール名</div></th>
                          <th className="p-0 font-normal"><div className="cell-content">ボール No.</div></th>
                          <th className="p-0 font-normal"><div className="cell-content leading-tight whitespace-nowrap tracking-tight">有効期限開始日</div></th>
                          <th className="p-0 font-normal"><div className="cell-content text-[8px] leading-tight">選手確認</div></th>
                          <th className="p-0 font-normal"><div className="cell-content text-[8px] leading-tight">受付確認</div></th>
                        </tr>
                      </thead>
                      <tbody>
                        {[0, 1, 2, 3, 4, 5].map((index) => {
                          const selectedId = eventData.selectedBallIds[index];
                          const ball = balls.find(b => b.id === selectedId);
                          return (
                            <tr key={index} className="h-[36px]">
                              <td className="p-0"><div className="cell-content text-[12px]">{index + 1}</div></td>
                              <td className="p-0"><div className="cell-content gothic whitespace-nowrap" style={{ fontSize: getAutoFontSize(ball?.maker || "", 13, 11) }}>{ball?.maker || ""}</div></td>
                              <td className="p-0 yellow-cell relative">{isExportMode ? (<div className="cell-content gothic text-black h-full whitespace-nowrap flex items-center justify-center" style={{ fontSize: getAutoFontSize(ball ? ball.name : '', 14, 13) }}>{ball ? ball.name : ''}</div>) : (<select className={`preview-select w-full h-full gothic ${!selectedId ? 'text-gray-400 print-hide-placeholder' : 'text-black'}`} value={selectedId || ""} style={{ fontSize: getAutoFontSize(ball ? ball.name : '', 14, 13) }} onChange={(e) => {const n=[...eventData.selectedBallIds];n[index]=e.target.value;setEventData({...eventData,selectedBallIds:n});}}><option value="">（クリックして選択）</option>{balls.map(b => <option key={b.id} value={b.id} className="text-black gothic">{b.name}</option>)}</select>)}</td>
                              <td className="p-0"><div className="cell-content gothic whitespace-nowrap" style={{ fontSize: getAutoFontSize(ball?.serialNo || "", 14, 11) }}>{ball?.serialNo || ""}</div></td>
                              <td className="p-0">{renderDateTwoLines(ball?.validDate)}</td>
                              <td className="p-0"><div className="cell-content text-[16px] gothic font-bold">{selectedId ? '☑' : '□'}</div></td>
                              <td className="p-0"></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* 注意書きと矢印をFlexboxとパディングで構築し、印刷時のズレを防止 */}
                    <div className="flex text-[11px] mb-2 mt-1 w-full items-end h-[16px] notice-container">
                      <div className="flex-grow text-right relative z-10 bg-white leading-none pr-1 pb-[1px]">
                        選手自身で非適合ボールリスト未掲載であることを確認し、☑を付けてください。
                      </div>
                      <div className="w-[6%] relative h-full shrink-0">
                        <div className="absolute w-[200px] h-[8px] border-b-[1.5px] border-r-[1.5px] border-black right-1/2 bottom-[0px] z-0"></div>
                        <div className="absolute w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-black right-[calc(50%-4px)] bottom-[8px] z-0"></div>
                      </div>
                      <div className="w-[6%] shrink-0"></div>
                    </div>

                    <div className="flex text-[8px] mt-1 mb-12 w-full items-stretch h-[25px]">
                      <div className="w-[3%]"></div>
                      <div className="w-[20%]"><table className="thin-border-table w-full h-full table-fixed"><tbody><tr><td className="p-0 w-1/2 bg-gray-50/10"><div className="cell-content text-[8px]">合計個数</div></td><td className="p-0 w-1/2"><div className="cell-content text-[11px] gothic">{selectedCount || '0'}</div></td></tr></tbody></table></div>
                      <div className="w-[15%]"></div>
                      <div className="w-[20%]"><table className="thin-border-table w-full h-full table-fixed"><tbody><tr><td className="p-0 w-[45%] bg-gray-50/10"><div className="cell-content text-[8px]">合計金額</div></td><td className="p-0 w-[55%] text-center"><div className="cell-content gothic text-[11px]">{totalFee ? totalFee.toLocaleString() : ''}</div></td></tr></tbody></table></div>
                      <div className="w-[6%]"></div>
                      <div className="w-[36%]"><table className="thin-border-table w-full h-full table-fixed"><tbody><tr><td className="p-0 w-[40%] bg-gray-50/10"><div className="cell-content text-[8px] whitespace-nowrap px-1">登録受付担当者名</div></td><td className="p-0 w-[60%] bg-white"></td></tr></tbody></table></div>
                    </div>

                    <table className="outer-border w-full text-center text-[12px] mb-6 table-fixed">
                      <thead><tr className="h-[30px] text-[12px] bg-gray-50/20"><th className="p-0 w-[16%] font-normal"><div className="cell-content">区分</div></th>{[...Array(12)].map((_, i) => <th key={i} className="p-0 font-normal"><div className="cell-content">{i + 1}個</div></th>)}</tr></thead>
                      <tbody className="text-[12px]">
                        <tr className="h-[70px]"><td className="p-0 bg-gray-50/10"><div className="cell-content">一般</div></td><td></td>{[5,10,15,30,45,60,75,90,105,120,135].map((v, i) => (<td key={i} className="p-0 text-[12px]">{(v*100).toLocaleString()}</td>))}</tr>
                        <tr className="h-[70px]"><td className="p-0 bg-gray-50/10"><div className="cell-content">特別会員</div></td><td></td><td></td><td></td><td className="p-0 text-[12px]">{(500).toLocaleString()}</td>{[20,35,50,65,80,95,110,125].map((v, i) => (<td key={i} className="p-0 text-[12px]">{(v*100).toLocaleString()}</td>))}</tr>
                        <tr className="h-[70px]"><td className="p-0 leading-tight text-[12px] bg-gray-50/10"><div className="cell-content">公認ゲーム<br/>600ゲーム<br/>以上</div></td><td></td>{[5,10,15,20,25,30,45,60,75,90,105].map((v, i) => (<td key={i} className="p-0 text-[12px]">{(v*100).toLocaleString()}</td>))}</tr>
                        <tr className="h-[70px]"><td className="p-0 leading-tight text-[12px] bg-gray-50/10"><div className="cell-content">特別会員で<br/>600ゲーム<br/>以上</div></td><td></td><td></td><td></td>{[5,10,15,20,35,50,65,80,95].map((v, i) => (<td key={i} className="p-0 text-[12px]">{(v*100).toLocaleString()}</td>))}</tr>
                      </tbody>
                    </table>

                    <div className="text-[13px] pl-4"><div className="mb-1 font-bold">※注意事項※</div><ol className="list-decimal pl-6 space-y-1.5 leading-relaxed text-gray-800"><li>特別会員証及び公認ゲーム認定証の提示がない場合は一般料金となります。</li><li>用紙は切り取らず、A4用紙のままご提出ください。</li><li>右手で投球する場合は「右」、左手で投球する場合は「左」を記入してください。</li></ol></div>
                    <div className="text-right text-[15px] mt-12 pr-4 tracking-widest font-bold">公益財団法人 JAPAN BOWLING</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-lg print-hidden z-20 pb-safe">
        <div className="max-w-md mx-auto flex justify-around">
          <button onClick={() => setActiveTab('input')} className={`flex-1 py-4 flex flex-col items-center text-sm font-bold ${activeTab === 'input' ? 'text-[#1f4e79] border-t-2 border-[#1f4e79] bg-blue-50/30' : 'text-gray-400'}`}><Edit className="w-5 h-5 mb-1" />基本情報入力</button>
          <button onClick={() => setActiveTab('preview')} className={`flex-1 py-4 flex flex-col items-center text-sm font-bold ${activeTab === 'preview' ? 'text-[#1f4e79] border-t-2 border-[#1f4e79] bg-blue-50/30' : 'text-gray-400'}`}><FileText className="w-5 h-5 mb-1" />ボール登録証</button>
        </div>
      </nav>
      <style>{`.pb-safe { padding-bottom: env(safe-area-inset-bottom); }`}</style>
    </div>
  );
}
