/**
 * 리본 UI 프리미티브 - Word 365 리본 UI를 정확히 재현
 * 모든 탭에서 공유하는 기본 컴포넌트 모음
 * 아이콘: lucide-react 사용
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";

/* ── 공통 상수 ── */
const RIBBON_FONT = "'Segoe UI', '맑은 고딕', sans-serif";
const HOVER_BG = "#E5F1FB";
const ACTIVE_BG = "#CCE4F7";
const ACTIVE_BORDER = "#98C6EA";
const PRESSED_BG = "#B3D7F2";

/* ── 기본 리본 버튼 (Word 365 스타일) ── */
export function RibbonBtn({
  children,
  active,
  onClick,
  title,
  style,
  small,
  disabled,
  className,
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  /** 배경색 결정: active > pressed > hovered > transparent */
  const getBg = () => {
    if (active) return ACTIVE_BG;
    if (pressed) return PRESSED_BG;
    if (hovered && !disabled) return HOVER_BG;
    return "transparent";
  };

  /** 테두리 결정: active 상태일 때만 실선 */
  const getBorder = () => {
    if (active) return `1px solid ${ACTIVE_BORDER}`;
    if (pressed) return `1px solid ${ACTIVE_BORDER}`;
    return "1px solid transparent";
  };

  return (
    <button
      type="button"
      className={`word-ribbon-btn${active ? " active" : ""}${className ? " " + className : ""}`}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) {
          setPressed(true);
          onClick?.();
        }
      }}
      onMouseUp={() => setPressed(false)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      title={title || ""}
      disabled={disabled}
      style={{
        height: small ? 22 : 26,
        minWidth: small ? 22 : 26,
        padding: small ? "0 4px" : "0 6px",
        background: getBg(),
        color: disabled ? "#aaa" : "var(--ribbon-fg, #333)",
        border: getBorder(),
        borderRadius: 2,
        fontSize: small ? 11 : 12,
        cursor: disabled ? "default" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        fontFamily: RIBBON_FONT,
        lineHeight: 1,
        position: "relative",
        opacity: disabled ? 0.45 : 1,
        transition: "background 0.06s, border-color 0.06s",
        outline: "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ── 대형 리본 버튼 (붙여넣기 등, 분할 버튼 지원) ── */
export function RibbonBtnLarge({
  icon,
  label,
  onClick,
  title,
  active,
  split,
  onDropdown,
  disabled,
}) {
  const [hoveredTop, setHoveredTop] = useState(false);
  const [hoveredBottom, setHoveredBottom] = useState(false);
  const [hoveredWhole, setHoveredWhole] = useState(false);

  /** 분할 모드가 아닐 때는 전체를 하나의 버튼으로 취급 */
  const isSplit = !!split;

  /* 상단 영역 배경 */
  const getTopBg = () => {
    if (active) return ACTIVE_BG;
    if (isSplit && hoveredTop) return HOVER_BG;
    if (!isSplit && hoveredWhole) return HOVER_BG;
    return "transparent";
  };

  /* 하단 드롭다운 배경 */
  const getBottomBg = () => {
    if (active) return ACTIVE_BG;
    if (hoveredBottom) return HOVER_BG;
    return "transparent";
  };

  /* 전체 컨테이너 테두리 */
  const getContainerBorder = () => {
    if (active) return `1px solid ${ACTIVE_BORDER}`;
    if (isSplit && (hoveredTop || hoveredBottom)) return `1px solid ${ACTIVE_BORDER}`;
    if (!isSplit && hoveredWhole) return `1px solid ${ACTIVE_BORDER}`;
    return "1px solid transparent";
  };

  /* 분할 모드: 상단/하단 사이 구분선 */
  const getSplitBorder = () => {
    if (hoveredTop || hoveredBottom || active) return `1px solid ${ACTIVE_BORDER}`;
    return "1px solid transparent";
  };

  if (!isSplit) {
    /* 비분할 모드 - 단일 버튼 */
    return (
      <button
        type="button"
        className="word-ribbon-btn"
        onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick?.(); }}
        onMouseEnter={() => setHoveredWhole(true)}
        onMouseLeave={() => setHoveredWhole(false)}
        title={title || label}
        disabled={disabled}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 66,
          minWidth: 50,
          padding: "4px 6px 2px",
          background: getTopBg(),
          border: getContainerBorder(),
          borderRadius: 2,
          cursor: disabled ? "default" : "pointer",
          color: disabled ? "#aaa" : "var(--ribbon-fg, #333)",
          opacity: disabled ? 0.45 : 1,
          fontFamily: RIBBON_FONT,
          outline: "none",
          transition: "background 0.06s, border-color 0.06s",
        }}
      >
        <span style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 20, height: 20, flexShrink: 0,
        }}>
          {icon}
        </span>
        <span style={{
          fontSize: 9, marginTop: 3, lineHeight: 1.2,
          whiteSpace: "nowrap", textAlign: "center",
        }}>
          {label}
        </span>
      </button>
    );
  }

  /* 분할 모드 - 상단 액션 + 하단 드롭다운 */
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        border: getContainerBorder(),
        borderRadius: 2,
        overflow: "hidden",
        transition: "border-color 0.06s",
      }}
    >
      {/* 상단: 메인 액션 */}
      <button
        type="button"
        className="word-ribbon-btn"
        onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick?.(); }}
        onMouseEnter={() => setHoveredTop(true)}
        onMouseLeave={() => setHoveredTop(false)}
        title={title || label}
        disabled={disabled}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 46,
          minWidth: 50,
          padding: "4px 6px 2px",
          background: getTopBg(),
          border: "none",
          borderBottom: getSplitBorder(),
          cursor: disabled ? "default" : "pointer",
          color: disabled ? "#aaa" : "var(--ribbon-fg, #333)",
          opacity: disabled ? 0.45 : 1,
          fontFamily: RIBBON_FONT,
          outline: "none",
          transition: "background 0.06s",
        }}
      >
        <span style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 20, height: 20, flexShrink: 0,
        }}>
          {icon}
        </span>
        <span style={{
          fontSize: 9, marginTop: 2, lineHeight: 1.2,
          whiteSpace: "nowrap", textAlign: "center",
        }}>
          {label}
        </span>
      </button>

      {/* 하단: 드롭다운 화살표 */}
      <button
        type="button"
        className="word-ribbon-btn"
        onMouseDown={(e) => { e.preventDefault(); if (!disabled) onDropdown?.(); }}
        onMouseEnter={() => setHoveredBottom(true)}
        onMouseLeave={() => setHoveredBottom(false)}
        disabled={disabled}
        style={{
          height: 20,
          minWidth: 50,
          border: "none",
          background: getBottomBg(),
          cursor: disabled ? "default" : "pointer",
          fontSize: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ribbon-fg, #555)",
          outline: "none",
          transition: "background 0.06s",
          padding: 0,
        }}
      >
        <ChevronDown size={10} strokeWidth={2} />
      </button>
    </div>
  );
}

/* ── 리본 셀렉트 (Word 365 스타일 드롭다운) ── */
export function RibbonSelect({ value, options, onChange, title, style, renderOption }) {
  const [focused, setFocused] = useState(false);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      title={title}
      style={{
        height: 24,
        padding: "0 18px 0 6px",
        background: "var(--ribbon-input-bg, #fff)",
        border: focused
          ? `1px solid #0078D4`
          : "1px solid var(--ribbon-input-border, #c0c0c0)",
        borderRadius: 2,
        fontSize: 12,
        cursor: "pointer",
        color: "var(--ribbon-fg, #333)",
        fontFamily: RIBBON_FONT,
        outline: focused ? "1px solid #0078D4" : "none",
        outlineOffset: -1,
        WebkitAppearance: "none",
        MozAppearance: "none",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23666'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 4px center",
        backgroundSize: "10px 6px",
        ...style,
      }}
    >
      {options.map((o) => (
        <option
          key={o.value}
          value={o.value}
          style={{ fontFamily: o.style?.fontFamily || "inherit", fontSize: 13, ...o.style }}
        >
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ── 리본 콤보박스 (편집 가능, 글꼴/크기 선택용) ── */
export function RibbonComboBox({
  value,
  options,
  onChange,
  title,
  style,
  fontPreview,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  /* value prop이 변경되면 입력값도 동기화 */
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  /* 외부 클릭 시 드롭다운 닫기 */
  useEffect(() => {
    if (!open) return;
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  /* 입력값에 따라 옵션 필터링 */
  const filteredOptions = options.filter((o) => {
    if (!inputValue) return true;
    const search = inputValue.toLowerCase();
    return (
      o.label.toLowerCase().includes(search) ||
      (o.value && o.value.toString().toLowerCase().includes(search))
    );
  });

  /* 스크롤하여 선택된 항목 표시 */
  useEffect(() => {
    if (open && listRef.current) {
      const activeEl = listRef.current.querySelector("[data-active='true']");
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [open]);

  const handleSelect = (opt) => {
    setInputValue(opt.label);
    onChange(opt.value);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (!open) setOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      /* 정확히 일치하는 옵션이 있으면 선택, 아니면 현재값 그대로 전달 */
      const match = options.find(
        (o) => o.label.toLowerCase() === inputValue.toLowerCase()
      );
      if (match) {
        handleSelect(match);
      } else if (inputValue) {
        onChange(inputValue);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setInputValue(value || "");
    } else if (e.key === "ArrowDown" && !open) {
      setOpen(true);
    }
  };

  const handleBlur = () => {
    setFocused(false);
    /* 잠시 대기 후 닫기 (클릭 이벤트가 먼저 발생하도록) */
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        /* 유효하지 않은 입력값이면 이전 값으로 복원 */
        const match = options.find(
          (o) =>
            o.label.toLowerCase() === inputValue.toLowerCase() ||
            o.value.toString() === inputValue
        );
        if (!match && value) {
          const current = options.find((o) => o.value.toString() === value.toString());
          setInputValue(current?.label || value);
        }
      }
    }, 150);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-flex" }}>
      {/* 입력 필드 + 드롭다운 토글 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 24,
          border: focused
            ? "1px solid #0078D4"
            : "1px solid var(--ribbon-input-border, #c0c0c0)",
          borderRadius: 2,
          background: "var(--ribbon-input-bg, #fff)",
          outline: focused ? "1px solid #0078D4" : "none",
          outlineOffset: -1,
          overflow: "hidden",
          ...style,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          title={title}
          placeholder={placeholder}
          style={{
            border: "none",
            outline: "none",
            height: "100%",
            padding: "0 4px",
            fontSize: 12,
            fontFamily: fontPreview
              ? options.find((o) => o.label === inputValue)?.style?.fontFamily || RIBBON_FONT
              : RIBBON_FONT,
            color: "var(--ribbon-fg, #333)",
            background: "transparent",
            width: "100%",
            minWidth: 0,
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen(!open);
            inputRef.current?.focus();
          }}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: "0 3px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            color: "#666",
            flexShrink: 0,
          }}
        >
          <ChevronDown size={10} />
        </button>
      </div>

      {/* 드롭다운 목록 */}
      {open && filteredOptions.length > 0 && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 300,
            background: "#fff",
            border: "1px solid #d1d5db",
            borderRadius: 2,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            maxHeight: 260,
            overflowY: "auto",
            marginTop: 1,
          }}
        >
          {filteredOptions.map((o) => {
            const isActive =
              o.value.toString() === value?.toString() ||
              o.label === inputValue;
            return (
              <div
                key={o.value}
                data-active={isActive ? "true" : undefined}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(o);
                }}
                style={{
                  padding: "4px 8px",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: fontPreview && o.style?.fontFamily
                    ? o.style.fontFamily
                    : RIBBON_FONT,
                  background: isActive ? "#CCE8FF" : "transparent",
                  color: "#333",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  transition: "background 0.06s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = HOVER_BG;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isActive ? "#CCE8FF" : "transparent";
                }}
              >
                {o.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── 그룹 구분선 (세로 1px 라인) ── */
export function GroupSep() {
  return (
    <div
      style={{
        width: 1,
        alignSelf: "stretch",
        background: "var(--ribbon-sep, #d1d5db)",
        margin: "2px 4px",
        flexShrink: 0,
      }}
    />
  );
}

/* ── 리본 그룹 (콘텐츠 + 하단 라벨 + 대화상자 런처) ── */
export function RibbonGroup({ label, children, dialogLauncher }) {
  const [launcherHovered, setLauncherHovered] = useState(false);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        padding: "3px 6px 0",
      }}
    >
      {/* 콘텐츠 영역 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          alignItems: "flex-start",
          justifyContent: "flex-start",
        }}
      >
        {children}
      </div>

      {/* 하단 라벨 + 대화상자 런처 버튼 */}
      <div
        style={{
          fontSize: 9,
          color: "var(--ribbon-label, #888)",
          marginTop: 1,
          paddingBottom: 2,
          fontFamily: RIBBON_FONT,
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: 2,
          lineHeight: 1,
        }}
      >
        {label}
        {dialogLauncher && (
          <button
            type="button"
            onClick={dialogLauncher}
            title={`${label} 대화 상자`}
            onMouseEnter={() => setLauncherHovered(true)}
            onMouseLeave={() => setLauncherHovered(false)}
            style={{
              width: 11,
              height: 11,
              border: "1px solid transparent",
              background: launcherHovered ? HOVER_BG : "transparent",
              borderColor: launcherHovered ? ACTIVE_BORDER : "transparent",
              cursor: "pointer",
              fontSize: 7,
              color: "var(--ribbon-label, #777)",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 1,
              transition: "background 0.06s, border-color 0.06s",
              outline: "none",
              lineHeight: 1,
            }}
          >
            ↘
          </button>
        )}
      </div>
    </div>
  );
}

/* ── 드롭다운 버튼 (클릭으로 토글, 외부 클릭으로 닫기) ── */
export function DropdownButton({
  trigger,
  children,
  align = "left",
  width,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  /* 외부 클릭 감지 */
  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "inline-flex", cursor: "pointer" }}
      >
        {trigger}
      </div>
      {open && (
        <div
          className="word-dropdown-menu"
          style={{
            position: "absolute",
            top: "100%",
            [align === "right" ? "right" : "left"]: 0,
            zIndex: 200,
            marginTop: 2,
            opacity: 1,
            transform: "translateY(0)",
            animation: "ribbonDropdownIn 0.1s ease-out",
            ...(width ? { width, minWidth: width } : {}),
          }}
          onClick={(e) => {
            /* 드롭다운 아이템 클릭 시에만 닫기 */
            if (e.target.closest(".word-dropdown-item")) setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Word 365 테마 색상 행 (상단 10색) ── */
const THEME_COLORS = [
  "#FFFFFF", "#000000", "#E7E6E6", "#44546A", "#4472C4",
  "#ED7D31", "#A5A5A5", "#FFC000", "#5B9BD5", "#70AD47",
];

/* 테마 색상의 틴트/셰이드 매트릭스 (5행 x 10열) */
const THEME_TINTS = [
  ["#F2F2F2", "#7F7F7F", "#D0CECE", "#D6DCE4", "#D9E2F3", "#FBE5D6", "#EDEDED", "#FFF2CC", "#DEEBF7", "#E2EFDA"],
  ["#D9D9D9", "#595959", "#AEAAAA", "#ADB9CA", "#B4C7E7", "#F8CBAD", "#DBDBDB", "#FFE599", "#BDD7EE", "#C5E0B4"],
  ["#BFBFBF", "#3F3F3F", "#757171", "#8497B0", "#8FAADC", "#F4B183", "#C0C0C0", "#FFD966", "#9CC3E5", "#A9D18E"],
  ["#A6A6A6", "#262626", "#3A3838", "#333F50", "#2F5597", "#C55A11", "#7B7B7B", "#BF9000", "#2E75B6", "#548235"],
  ["#808080", "#0D0D0D", "#171616", "#222B35", "#1F3864", "#833C0B", "#525252", "#7F6000", "#1F4E79", "#375623"],
];

/* ── 색상 선택 그리드 (Word 365 스타일) ── */
export function ColorGrid({
  colors,
  value,
  onChange,
  columns = 10,
  recentColors = [],
  showNoColor,
  showMoreColors,
  noColorLabel = "색 없음",
  moreColorsLabel = "다른 색...",
}) {
  const [hoveredColor, setHoveredColor] = useState(null);

  /** 개별 색상 셀 렌더링 */
  const renderCell = (color, key) => {
    const isSelected = value?.toLowerCase() === color.toLowerCase();
    const isHovered = hoveredColor === key;

    return (
      <button
        key={key}
        type="button"
        onClick={() => onChange(color)}
        title={color}
        onMouseEnter={() => setHoveredColor(key)}
        onMouseLeave={() => setHoveredColor(null)}
        style={{
          width: 17,
          height: 17,
          background: color,
          border: isSelected
            ? "2px solid #333"
            : isHovered
              ? "2px solid #666"
              : "1px solid #d0d0d0",
          borderRadius: 1,
          cursor: "pointer",
          padding: 0,
          transform: isHovered ? "scale(1.3)" : "scale(1)",
          transition: "transform 0.06s ease, border 0.06s",
          zIndex: isHovered ? 2 : 1,
          position: "relative",
          boxShadow: isSelected ? "0 0 0 1px #fff inset" : "none",
          outline: "none",
        }}
      />
    );
  };

  /* 색 없음 옵션 */
  const renderNoColor = () => {
    if (!showNoColor) return null;
    return (
      <button
        type="button"
        onClick={() => onChange(null)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          padding: "5px 8px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 11,
          fontFamily: RIBBON_FONT,
          color: "#333",
          borderBottom: "1px solid #e8e8e8",
          marginBottom: 4,
          transition: "background 0.06s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = HOVER_BG; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{
          width: 14, height: 14, border: "1px solid #ccc",
          background: "#fff", display: "inline-flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 10, color: "#cc0000", borderRadius: 1,
        }}>
          ✕
        </span>
        {noColorLabel}
      </button>
    );
  };

  /* 다른 색 옵션 */
  const renderMoreColors = () => {
    if (!showMoreColors) return null;
    return (
      <button
        type="button"
        onClick={() => {
          const result = window.prompt("색상 코드 입력 (예: #FF5500):");
          if (result) onChange(result);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          padding: "5px 8px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          fontSize: 11,
          fontFamily: RIBBON_FONT,
          color: "#333",
          borderTop: "1px solid #e8e8e8",
          marginTop: 4,
          transition: "background 0.06s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = HOVER_BG; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <span style={{
          width: 14, height: 14, borderRadius: 7,
          background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
          display: "inline-block",
        }} />
        {moreColorsLabel}
      </button>
    );
  };

  return (
    <div style={{ padding: 4 }}>
      {/* 색 없음 */}
      {renderNoColor()}

      {/* 테마 색상 (상위 10색) */}
      <div style={{ marginBottom: 2 }}>
        <div style={{
          fontSize: 10, color: "#666", marginBottom: 3,
          fontFamily: RIBBON_FONT,
        }}>
          테마 색
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 17px)`, gap: 2 }}>
          {THEME_COLORS.slice(0, columns).map((c, i) => renderCell(c, `theme-${i}`))}
        </div>
      </div>

      {/* 틴트/셰이드 행 */}
      <div style={{ marginBottom: 4 }}>
        {THEME_TINTS.map((row, ri) => (
          <div key={`tint-row-${ri}`} style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 17px)`,
            gap: 2,
            marginTop: ri === 0 ? 2 : 0,
          }}>
            {row.slice(0, columns).map((c, ci) => renderCell(c, `tint-${ri}-${ci}`))}
          </div>
        ))}
      </div>

      {/* 표준 색상 */}
      <div style={{ marginBottom: 2 }}>
        <div style={{
          fontSize: 10, color: "#666", marginBottom: 3, marginTop: 4,
          fontFamily: RIBBON_FONT,
        }}>
          표준 색
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 17px)`,
          gap: 2,
        }}>
          {colors.slice(0, columns).map((c, i) => renderCell(c, `std-${i}`))}
        </div>
      </div>

      {/* 전체 팔레트 (기존 colors 배열에서 나머지) */}
      {colors.length > columns && (
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 17px)`,
          gap: 2,
          marginTop: 2,
        }}>
          {colors.slice(columns).map((c, i) => renderCell(c, `pal-${i}`))}
        </div>
      )}

      {/* 최근 사용 색상 */}
      {recentColors.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{
            fontSize: 10, color: "#666", marginBottom: 3,
            fontFamily: RIBBON_FONT,
          }}>
            최근에 사용한 색
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 17px)`, gap: 2 }}>
            {recentColors.slice(0, columns).map((c, i) => renderCell(c, `recent-${i}`))}
          </div>
        </div>
      )}

      {/* 다른 색 */}
      {renderMoreColors()}
    </div>
  );
}
