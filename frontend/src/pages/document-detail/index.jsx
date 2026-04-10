/**
 * DocumentDetailPage — 문서 상세 보기 + 인라인 Word 스타일 편집 (메인 오케스트레이터)
 * 리본 툴바, A4 캔버스, TipTap 에디터, 사이드 패널, 모달을 조합
 */
import { EDITOR_CSS } from "./docDetailStyles";
import { RIBBON_TABS } from "./docDetailConstants";
import { Ruler, ConfirmModal } from "./DocDetailUI";
import { useDocDetailState } from "./useDocDetailState";
import {
  RibbonHome, RibbonInsert, RibbonDraw, RibbonDesign,
  RibbonLayout, RibbonReferences, RibbonReview, RibbonView, RibbonFile,
} from "./DocToolbar";
import DocMetaSidebar from "./DocMetaSidebar";
import {
  FindReplaceModal, TableInsertModal, ImageInsertModal,
  LinkInsertModal, WordCountModal, SymbolInsertModal,
} from "./DocModals";
import { TitleBar, TabBar, StatusBar } from "./DocFrameComponents";
import { A4Page, NavPane, FloatingSubToolbar } from "./DocCanvasArea";

export default function DocumentDetailPage() {
  const state = useDocDetailState();

  /* ── 로딩/에러 표시 ── */
  if (state.loading) return <LoadingScreen />;
  if (state.error || !state.doc) return <ErrorScreen error={state.error} navigate={state.navigate} />;

  /* ── 리본 탭 컨텐츠 맵 ── */
  const ribbonContent = {
    file: <RibbonFile doc={state.doc} editor={state.editor} manualSave={state.manualSave} handlePrint={state.handlePrint} infoPanelOpen={state.infoPanelOpen} setInfoPanelOpen={state.setInfoPanelOpen} handleStatusChange={state.handleStatusChange} setDeleteOpen={state.setDeleteOpen} />,
    home: <RibbonHome editor={state.editor} currentFont={state.currentFont} currentSize={state.currentSize} applyFontFamily={state.applyFontFamily} applyFontSize={state.applyFontSize} fontColorOpen={state.fontColorOpen} setFontColorOpen={state.setFontColorOpen} applyFontColor={state.applyFontColor} highlightColorOpen={state.highlightColorOpen} setHighlightColorOpen={state.setHighlightColorOpen} applyHighlight={state.applyHighlight} lineSpacingOpen={state.lineSpacingOpen} setLineSpacingOpen={state.setLineSpacingOpen} notImpl={state.notImpl} setFindOpen={state.setFindOpen} />,
    insert: <RibbonInsert editor={state.editor} notImpl={state.notImpl} toast={state.toast} setTableModalOpen={state.setTableModalOpen} setImageModalOpen={state.setImageModalOpen} setLinkModalOpen={state.setLinkModalOpen} setInfoPanelOpen={state.setInfoPanelOpen} setSymbolModalOpen={state.setSymbolModalOpen} />,
    draw: <RibbonDraw editor={state.editor} notImpl={state.notImpl} />,
    design: <RibbonDesign notImpl={state.notImpl} />,
    layout: <RibbonLayout editor={state.editor} notImpl={state.notImpl} />,
    references: <RibbonReferences editor={state.editor} notImpl={state.notImpl} toast={state.toast} insertFootnote={state.insertFootnote} />,
    review: <RibbonReview editor={state.editor} notImpl={state.notImpl} toast={state.toast} setInfoPanelOpen={state.setInfoPanelOpen} setWordCountOpen={state.setWordCountOpen} comments={state.comments} setComments={state.setComments} />,
    view: <RibbonView notImpl={state.notImpl} viewMode={state.viewMode} setViewMode={state.setViewMode} showRuler={state.showRuler} setShowRuler={state.setShowRuler} showGridlines={state.showGridlines} setShowGridlines={state.setShowGridlines} showNavPane={state.showNavPane} setShowNavPane={state.setShowNavPane} setZoom={state.setZoom} />,
  };

  /* ═══ 렌더링 ═══ */
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", background: "#e8e8e4", fontFamily: "'맑은 고딕', 'Noto Sans KR', 'Segoe UI', sans-serif" }}>
      <style>{EDITOR_CSS}</style>

      {/* 타이틀 바 */}
      <TitleBar title={state.title} saving={state.saving} lastSaved={state.lastSaved} editor={state.editor} manualSave={state.manualSave} navigate={state.navigate} />

      {/* 탭 바 */}
      <TabBar tabs={RIBBON_TABS} activeTab={state.activeTab} setActiveTab={state.setActiveTab} setFindOpen={state.setFindOpen} />

      {/* 리본 컨텐츠 */}
      <div style={{
        background: "linear-gradient(to bottom, #f8f8f6 0%, #f0f0ee 100%)",
        borderBottom: "1px solid #c8c8c5",
        padding: "3px 8px", display: "flex", alignItems: "center",
        minHeight: 78, flexShrink: 0, overflowX: "auto", overflowY: "hidden",
      }}>
        {ribbonContent[state.activeTab]}
      </div>

      {/* 눈금자 */}
      <Ruler zoom={state.zoom} show={state.showRuler} />

      {/* 플로팅 서브 툴바 */}
      {state.editor && (
        <FloatingSubToolbar
          editor={state.editor} currentFont={state.currentFont} currentSize={state.currentSize}
          applyFontFamily={state.applyFontFamily} applyFontSize={state.applyFontSize}
          fontColorOpen={state.fontColorOpen} setFontColorOpen={state.setFontColorOpen} applyFontColor={state.applyFontColor}
          highlightColorOpen={state.highlightColorOpen} setHighlightColorOpen={state.setHighlightColorOpen} applyHighlight={state.applyHighlight}
          setLinkModalOpen={state.setLinkModalOpen} insertFootnote={state.insertFootnote}
        />
      )}

      {/* 문서 캔버스 */}
      <div style={{ flex: 1, overflow: "auto", background: "#d4d4d0", display: "flex", justifyContent: "center", paddingTop: 20, paddingBottom: 40 }}>
        {state.showNavPane && <NavPane title={state.title} onClose={() => state.setShowNavPane(false)} />}
        <div style={{ display: "flex", gap: 0 }}>
          <A4Page doc={state.doc} title={state.title} onTitleChange={state.onTitleChange} editor={state.editor} zoom={state.zoom} showGridlines={state.showGridlines} />
          {state.infoPanelOpen && (
            <DocMetaSidebar
              doc={state.doc} id={state.id} setDoc={state.setDoc} handleStatusChange={state.handleStatusChange} toast={state.toast}
              stats={state.stats} editor={state.editor} lastSaved={state.lastSaved}
              comments={state.comments} setComments={state.setComments} commentText={state.commentText} setCommentText={state.setCommentText} addComment={state.addComment}
              setDeleteOpen={state.setDeleteOpen} onClose={() => state.setInfoPanelOpen(false)}
            />
          )}
        </div>
      </div>

      {/* 상태 바 */}
      <StatusBar stats={state.stats} viewMode={state.viewMode} setViewMode={state.setViewMode} zoom={state.zoom} setZoom={state.setZoom} />

      {/* 모달들 */}
      <FindReplaceModal open={state.findOpen} onClose={() => state.setFindOpen(false)} findText={state.findText} setFindText={state.setFindText} replaceText={state.replaceText} setReplaceText={state.setReplaceText} onFind={state.handleFind} onReplaceAll={state.handleReplaceAll} />
      <TableInsertModal open={state.tableModalOpen} onClose={() => state.setTableModalOpen(false)} tableRows={state.tableRows} setTableRows={state.setTableRows} tableCols={state.tableCols} setTableCols={state.setTableCols} onInsert={state.insertTable} />
      <ImageInsertModal open={state.imageModalOpen} onClose={() => state.setImageModalOpen(false)} imageUrl={state.imageUrl} setImageUrl={state.setImageUrl} onInsert={state.insertImage} fileInputRef={state.fileInputRef} onFileChange={state.handleImageFile} />
      <LinkInsertModal open={state.linkModalOpen} onClose={() => state.setLinkModalOpen(false)} linkUrl={state.linkUrl} setLinkUrl={state.setLinkUrl} linkLabel={state.linkLabel} setLinkLabel={state.setLinkLabel} onInsert={state.insertLink} onRemove={() => { state.editor?.chain().focus().unsetLink().run(); state.setLinkModalOpen(false); }} />
      <WordCountModal open={state.wordCountOpen} onClose={() => state.setWordCountOpen(false)} stats={state.stats} editor={state.editor} />
      <SymbolInsertModal open={state.symbolModalOpen} onClose={() => state.setSymbolModalOpen(false)} editor={state.editor} />
      <ConfirmModal open={state.deleteOpen} title="문서 삭제" message="이 문서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다." onConfirm={state.handleDelete} onCancel={() => state.setDeleteOpen(false)} />
      {state.Toast}
    </div>
  );
}

/* ═══ 로딩/에러 화면 ═══ */

function LoadingScreen() {
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#e8e8e4" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 28, height: 28, border: "3px solid #2b579a", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ fontSize: 12, color: "#888" }}>문서를 불러오는 중...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

function ErrorScreen({ error, navigate }) {
  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#e8e8e4" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#c44", marginBottom: 16 }}>{error || "문서를 찾을 수 없습니다."}</p>
        <button onClick={() => navigate("/vault")} style={{ padding: "8px 20px", background: "#fff", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>목록으로 돌아가기</button>
      </div>
    </div>
  );
}
