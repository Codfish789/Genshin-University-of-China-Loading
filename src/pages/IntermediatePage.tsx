import { useState, useEffect } from 'react';
import './IntermediatePage.less';

export function IntermediatePage({ onConfirm, onCancel }: { onConfirm: () => void, onCancel: () => void }) {
  const [progress, setProgress] = useState(0);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [isDaytime, setIsDaytime] = useState(true);
  
  const elements = [
    '/Genshin/Elements/SVG/elementPyro.svg',
    '/Genshin/Elements/SVG/elementHydro.svg', 
    '/Genshin/Elements/SVG/elementAmeno.svg',
    '/Genshin/Elements/SVG/elementElectro.svg',
    '/Genshin/Elements/SVG/elementDendro.svg',
    '/Genshin/Elements/SVG/elementCryo.svg',
    '/Genshin/Elements/SVG/elementGeo.svg'
  ];

  // 检测是否为白天模式 (UTC+8)
  const checkDaytime = () => {
    const now = new Date();
    const utc8Time = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const hour = utc8Time.getUTCHours();
    return hour >= 6 && hour < 18; // 6:00-18:00 为白天
  };

  // 计算每个图标的进度百分比
  const getIconProgress = (index: number, totalProgress: number) => {
    const totalIcons = elements.length;
    const progressPerIcon = 100 / totalIcons;
    const iconStartProgress = index * progressPerIcon;
    const iconEndProgress = (index + 1) * progressPerIcon;
    
    if (totalProgress <= iconStartProgress) {
      return 0;
    } else if (totalProgress >= iconEndProgress) {
      return 100;
    } else {
      return ((totalProgress - iconStartProgress) / progressPerIcon) * 100;
    }
  };

  useEffect(() => {
    setIsDaytime(checkDaytime());
    
    const timeInterval = setInterval(() => {
      setIsDaytime(checkDaytime());
    }, 60000);

    // 生成1-2秒的随机加载时间
    const randomLoadingTime = Math.random() * 1000 + 1000; // 1000-2000ms
    const totalSteps = 100; // 总进度步数
    const stepInterval = randomLoadingTime / totalSteps; // 每步的时间间隔
    const progressIncrement = 100 / totalSteps; // 每步的进度增量

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setLoadingComplete(true);
          setTimeout(() => {
            onConfirm();
          }, 1000);
          clearInterval(interval);
          return prev;
        }
        return prev + progressIncrement;
      });
    }, stepInterval);
    
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [onConfirm]);

  return (
    <div className={`intermediate-page ${isDaytime ? 'daytime' : 'nighttime'}`}>
      <div className="genshin-loading">
        <div className="element-progress-bar">
          {elements.map((element, index) => {
            const iconProgress = getIconProgress(index, progress);
            return (
              <div
                key={index}
                className="element-icon"
                style={{
                  '--icon-progress': `${iconProgress}%`
                } as React.CSSProperties}
              >
                <img src={element} alt={`Element ${index}`} className="icon-base" />
                <img src={element} alt={`Element ${index}`} className="icon-active" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}