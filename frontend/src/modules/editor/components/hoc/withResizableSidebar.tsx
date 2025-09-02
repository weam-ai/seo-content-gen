import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  ComponentType,
} from 'react';
import { GripVertical } from 'lucide-react';

// Debounce utility function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface ResizableSidebarConfig {
  /** Minimum width in pixels */
  minWidth?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Default width in pixels */
  defaultWidth?: number;
  /** localStorage key for persisting width */
  storageKey?: string;
  /** Position of resize handle ('left' | 'right') */
  handlePosition?: 'left' | 'right';
  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts?: boolean;
  /** Step size for keyboard resize */
  keyboardStep?: number;
  /** Maximum percentage of viewport width */
  maxViewportPercentage?: number;
}

export interface ResizableSidebarProps {
  /** Whether the sidebar is currently open/visible */
  isOpen: boolean;
  /** Custom className for the sidebar container */
  className?: string;
  /** Custom style for the sidebar container */
  style?: React.CSSProperties;
  /** Optional callback to reset width to default */
  onResetWidth?: () => void;
}

const defaultConfig: Required<ResizableSidebarConfig> = {
  minWidth: 280,
  maxWidth: 600,
  defaultWidth: 320,
  storageKey: 'sidebarWidth',
  handlePosition: 'left',
  enableKeyboardShortcuts: true,
  keyboardStep: 20,
  maxViewportPercentage: 0.4,
};

/**
 * Higher-Order Component that adds resizable functionality to any sidebar component
 *
 * Features:
 * - Drag to resize with configurable constraints
 * - Double-click to reset to default width
 * - Keyboard shortcuts (Ctrl/Cmd + Shift + arrows/0)
 * - Width persistence in localStorage
 * - Responsive behavior
 * - Visual feedback during resize
 *
 * @param WrappedComponent - The component to make resizable
 * @param config - Configuration options for resize behavior
 */
export function withResizableSidebar<P extends object>(
  WrappedComponent: ComponentType<P>,
  config: ResizableSidebarConfig = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  const ResizableSidebarComponent: React.FC<P & ResizableSidebarProps> = (
    props
  ) => {
    const {
      isOpen,
      className = '',
      style = {},
      onResetWidth,
      ...wrappedProps
    } = props;

    // Sidebar width state
    const [sidebarWidth, setSidebarWidth] = useState(finalConfig.defaultWidth);
    const [isResizing, setIsResizing] = useState(false);
    const [showWidthIndicator, setShowWidthIndicator] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);

    // Debounce the width for localStorage saving (only during drag)
    const debouncedWidth = useDebounce(sidebarWidth, isResizing ? 100 : 0);

    // Helper function to save width to localStorage
    const saveWidthToStorage = useCallback(
      (width: number) => {
        if (width !== finalConfig.defaultWidth) {
          try {
            localStorage.setItem(finalConfig.storageKey, width.toString());
            console.debug(
              `[ResizableSidebar] Saved width ${width}px to localStorage with key: ${finalConfig.storageKey}`
            );
          } catch (error) {
            console.warn(
              '[ResizableSidebar] Failed to save width to localStorage:',
              error
            );
          }
        }
      },
      [finalConfig.storageKey, finalConfig.defaultWidth]
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        setShowWidthIndicator(true);
        startXRef.current = e.clientX;
        startWidthRef.current = sidebarWidth;

        // Add resizing class to body
        document.body.classList.add('sidebar-resizing');
      },
      [sidebarWidth]
    );

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isResizing) return;

        const deltaX =
          finalConfig.handlePosition === 'left'
            ? startXRef.current - e.clientX // Left handle: negative delta increases width
            : e.clientX - startXRef.current; // Right handle: positive delta increases width

        const newWidth = Math.min(
          finalConfig.maxWidth,
          Math.max(finalConfig.minWidth, startWidthRef.current + deltaX)
        );
        setSidebarWidth(newWidth);
      },
      [isResizing]
    );

    const handleMouseUp = useCallback(() => {
      setIsResizing(false);
      document.body.classList.remove('sidebar-resizing');

      // Hide width indicator after a delay
      setTimeout(() => {
        setShowWidthIndicator(false);
      }, 1000);
    }, []);

    const handleDoubleClick = useCallback(() => {
      setSidebarWidth(finalConfig.defaultWidth);
      saveWidthToStorage(finalConfig.defaultWidth);
      setShowWidthIndicator(true);
      setTimeout(() => setShowWidthIndicator(false), 1000);
      onResetWidth?.();
    }, [saveWidthToStorage, onResetWidth]);

    // Add global mouse event listeners
    useEffect(() => {
      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
      }
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Save width to localStorage with debouncing during drag
    useEffect(() => {
      if (isOpen) {
        saveWidthToStorage(debouncedWidth);
      }
    }, [debouncedWidth, isOpen, saveWidthToStorage]);

    // Also save immediately when resizing stops
    useEffect(() => {
      if (!isResizing && isOpen) {
        saveWidthToStorage(sidebarWidth);
      }
    }, [isResizing, sidebarWidth, isOpen, saveWidthToStorage]);

    // Load width from localStorage on mount with error handling
    useEffect(() => {
      try {
        const savedWidth = localStorage.getItem(finalConfig.storageKey);
        console.debug(
          `[ResizableSidebar] Loading from localStorage key: ${finalConfig.storageKey}, value: ${savedWidth}`
        );

        if (savedWidth && savedWidth !== 'null' && savedWidth !== 'undefined') {
          const width = parseInt(savedWidth, 10);
          if (
            !isNaN(width) &&
            width >= finalConfig.minWidth &&
            width <= finalConfig.maxWidth
          ) {
            setSidebarWidth(width);
            console.debug(`[ResizableSidebar] Restored width: ${width}px`);
          } else {
            console.debug(
              `[ResizableSidebar] Invalid saved width ${width}, using default ${finalConfig.defaultWidth}px`
            );
          }
        } else {
          console.debug(
            `[ResizableSidebar] No saved width found, using default ${finalConfig.defaultWidth}px`
          );
        }
      } catch (error) {
        console.warn(
          '[ResizableSidebar] Failed to load width from localStorage:',
          error
        );
      }
    }, [
      finalConfig.storageKey,
      finalConfig.minWidth,
      finalConfig.maxWidth,
      finalConfig.defaultWidth,
    ]);

    // Handle window resize to ensure sidebar doesn't exceed viewport
    useEffect(() => {
      const handleWindowResize = () => {
        const maxAllowedWidth = Math.min(
          finalConfig.maxWidth,
          window.innerWidth * finalConfig.maxViewportPercentage
        );
        if (sidebarWidth > maxAllowedWidth) {
          setSidebarWidth(maxAllowedWidth);
        }
      };

      window.addEventListener('resize', handleWindowResize);
      return () => window.removeEventListener('resize', handleWindowResize);
    }, [sidebarWidth]);

    // Keyboard shortcuts for resizing
    useEffect(() => {
      if (!finalConfig.enableKeyboardShortcuts) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;

        // Only handle if Ctrl/Cmd + Shift is pressed
        if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
          switch (e.key) {
            case 'ArrowLeft':
              e.preventDefault();
              const newLeftWidth = Math.max(
                finalConfig.minWidth,
                sidebarWidth - finalConfig.keyboardStep
              );
              setSidebarWidth(newLeftWidth);
              saveWidthToStorage(newLeftWidth);
              setShowWidthIndicator(true);
              setTimeout(() => setShowWidthIndicator(false), 1000);
              break;
            case 'ArrowRight':
              e.preventDefault();
              const newRightWidth = Math.min(
                finalConfig.maxWidth,
                sidebarWidth + finalConfig.keyboardStep
              );
              setSidebarWidth(newRightWidth);
              saveWidthToStorage(newRightWidth);
              setShowWidthIndicator(true);
              setTimeout(() => setShowWidthIndicator(false), 1000);
              break;
            case '0':
              e.preventDefault();
              setSidebarWidth(finalConfig.defaultWidth);
              saveWidthToStorage(finalConfig.defaultWidth);
              setShowWidthIndicator(true);
              setTimeout(() => setShowWidthIndicator(false), 1000);
              break;
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, sidebarWidth, saveWidthToStorage]);

    const handlePosition = finalConfig.handlePosition;
    const handleClass = handlePosition === 'left' ? 'left-0' : 'right-0';

    return (
      <div
        ref={sidebarRef}
        className={`flex flex-col h-full overflow-hidden relative ${
          isOpen ? '' : 'w-0'
        } ${
          isResizing ? '' : 'transition-all duration-200 ease-out'
        } ${className}`}
        style={{
          width: isOpen ? `${sidebarWidth}px` : '0px',
          ...style,
        }}
      >
        {isOpen && (
          <>
            {/* Resize Handle */}
            <div
              className={`sidebar-resize-handle ${
                isResizing ? 'resizing' : ''
              } ${handleClass}`}
              onMouseDown={handleMouseDown}
              onDoubleClick={handleDoubleClick}
              title="Drag to resize • Double-click to reset • Ctrl+Shift+← → to resize • Ctrl+Shift+0 to reset"
            >
              <div
                className={`absolute ${
                  handlePosition === 'left' ? 'left-1' : 'right-1'
                } top-1/2 transform -translate-y-1/2 w-3 h-8 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-background border border-border rounded shadow-sm`}
              >
                <GripVertical className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>

            {/* Width Indicator */}
            {showWidthIndicator && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono z-20">
                {sidebarWidth}px
              </div>
            )}

            {/* Wrapped Component */}
            <WrappedComponent {...(wrappedProps as P)} />
          </>
        )}
      </div>
    );
  };

  ResizableSidebarComponent.displayName = `withResizableSidebar(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return ResizableSidebarComponent;
}

export default withResizableSidebar;
