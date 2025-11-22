import React, { useEffect, useState } from "react";

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const bootText = [
    "SYSTEM INIT... OK",
    "LOADING MODEM DRIVER... OK",
    "CONNECTING TO 56K GATEWAY... OK",
    "ESTABLISHING SECURE LINK... OK",
    "WAITING FOR INPUT..."
  ];

  useEffect(() => {
    let lineIndex = 0;
    
    const typeLine = () => {
      if (lineIndex >= bootText.length) {
        onComplete();
        return;
      }

      setLines(prev => [...prev, bootText[lineIndex]]);
      lineIndex++;
      
      // Random delay between lines to simulate loading
      setTimeout(typeLine, Math.random() * 500 + 200);
    };

    typeLine();
  }, []);

  return (
    <div className="font-mono text-[10px] text-green-500">
      {lines.map((line, i) => (
        <div key={i}>
          <span className="text-green-300">BIOS&gt;</span> {line}
        </div>
      ))}
    </div>
  );
}
