/** 공통 레이아웃 (헤더/푸터) 편집 탭 */
import { FormField } from "../../../components/admin";
import { SectionCard, ItemCard, AddButton, FieldRow } from "./shared";

export default function LayoutSection({ settings, update, updateItem, addItem, removeItem }) {
  const s = settings;
  return (
    <>
      <SectionCard title="네비게이션">
        {s["layout/nav"].items.map((item, i) => (
          <ItemCard key={i} onRemove={s["layout/nav"].items.length > 1 ? () => removeItem("layout/nav", i) : undefined}>
            <FieldRow>
              <FormField label="표시 텍스트" value={item.label} onChange={(v) => updateItem("layout/nav", i, "label", v)} />
              <FormField label="경로" value={item.to} onChange={(v) => updateItem("layout/nav", i, "to", v)} placeholder="/about" />
            </FieldRow>
          </ItemCard>
        ))}
        <AddButton onClick={() => addItem("layout/nav", { to: "/", label: "" })} label="메뉴 추가" />
      </SectionCard>

      <SectionCard title="푸터">
        <FieldRow>
          <FormField label="회사명" value={s["layout/footer"].companyName} onChange={(v) => update("layout/footer", "companyName", v)} />
          <FormField label="전화번호" value={s["layout/footer"].tel} onChange={(v) => update("layout/footer", "tel", v)} />
        </FieldRow>
        <FormField label="태그라인" type="textarea" minHeight={48} value={s["layout/footer"].tagline} onChange={(v) => update("layout/footer", "tagline", v)} />
        <FieldRow>
          <FormField label="주소" value={s["layout/footer"].address} onChange={(v) => update("layout/footer", "address", v)} />
          <FormField label="팩스" value={s["layout/footer"].fax} onChange={(v) => update("layout/footer", "fax", v)} />
        </FieldRow>
        <FieldRow>
          <FormField label="운영시간" value={s["layout/footer"].hours} onChange={(v) => update("layout/footer", "hours", v)} />
          <FormField label="비고" value={s["layout/footer"].note} onChange={(v) => update("layout/footer", "note", v)} />
        </FieldRow>
        <FormField label="저작권 표시" value={s["layout/footer"].copyright} onChange={(v) => update("layout/footer", "copyright", v)} />
      </SectionCard>
    </>
  );
}
