import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import './App.css';

const ERASER_COLOR = 'transparent';

function App() {
    const [currentColor, setCurrentColor] = useState('#FFFF00');
    const [isDrawMode, setDrawMode] = useState(true);
    const mapRef = useRef(null);
    const lastColor = useRef(currentColor);

    const sendToMap = useCallback((message) => {
        if (mapRef.current && mapRef.current.contentWindow) {
            mapRef.current.contentWindow.postMessage(message, '*');
        }
    }, []);

    const handleToggleDrawMode = useCallback(() => {
        const newMode = !isDrawMode;
        setDrawMode(newMode);
        sendToMap({ action: 'setDrawMode', isDrawMode: newMode });
        toast.success(newMode ? 'Draw Mode Activated' : 'Map Mode Activated');
    }, [isDrawMode, sendToMap]);

    const handleToggleErase = useCallback(() => {
        if (currentColor === ERASER_COLOR) {
            setCurrentColor(lastColor.current);
            toast.success('Paintbrush Activated');
        } else {
            lastColor.current = currentColor;
            setCurrentColor(ERASER_COLOR);
            toast.success('Eraser Activated');
        }
    }, [currentColor]);

    const handleMapClick = useCallback((event) => {
        if (isDrawMode && event.data && event.data.type === 'mapClick') {
            // Refocus the main window to re-enable keyboard shortcuts
            window.focus();
            const { lat, lng } = event.data;
            sendToMap({ action: 'addPixel', lat, lng, color: currentColor });
        }
    }, [isDrawMode, currentColor, sendToMap]);

    const handleClear = () => {
        sendToMap({ action: 'clearPixels' });
        toast.success('All pixels cleared!');
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.target.tagName.toLowerCase() === 'input') return;
            if (event.key.toLowerCase() === 'd') handleToggleDrawMode();
            if (event.key.toLowerCase() === 'e') handleToggleErase();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleToggleDrawMode, handleToggleErase]);
    
    useEffect(() => {
        window.addEventListener('message', handleMapClick);
        return () => window.removeEventListener('message', handleMapClick);
    }, [handleMapClick]);

    const onMapLoad = useCallback(() => {
        sendToMap({ action: 'setDrawMode', isDrawMode: true });
    }, [sendToMap]);

    return (
        <div className="App">
            <Toaster 
                position="bottom-center"
                toastOptions={{
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                }}
            />
            <div className="map-container">
                <iframe ref={mapRef} src="/map.html" title="Glubo Maps" width="100%" height="100%" style={{ border: 'none' }} onLoad={onMapLoad} />
            </div>
            <div className="toolbar">
                <button onClick={handleToggleDrawMode}>{isDrawMode ? 'Map Mode' : 'Draw Mode'} (D)</button>
                {isDrawMode && (
                    <>
                        <input type="color" value={currentColor === ERASER_COLOR ? '#ffffff' : currentColor} onChange={(e) => setCurrentColor(e.target.value)} />
                        <button onClick={handleToggleErase}>Erase (E)</button>
                        <button onClick={handleClear}>Clear All</button>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
