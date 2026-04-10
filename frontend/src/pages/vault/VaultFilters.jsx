/**
 * VaultFilters — 문서 보관소 필터 바
 * - 문서 유형, 상태, 중요도 드롭다운 + 검색 입력
 */
import { Select } from "../../components/ui/Select";
import { Input } from "../../components/ui/Input";
import { ALL_DOCUMENT_TYPES, getTypeLabel } from "../../utils/document-types";
import { STATUS_LABELS } from "../../utils/constants";
import { IMPORTANCE_OPTIONS } from "./vaultConstants";

/**
 * @param {object} props
 * @param {string} props.typeFilter - 선택된 문서 유형
 * @param {function} props.onTypeChange - 유형 변경 핸들러
 * @param {string} props.statusFilter - 선택된 상태
 * @param {function} props.onStatusChange - 상태 변경 핸들러
 * @param {string} props.importanceFilter - 선택된 중요도
 * @param {function} props.onImportanceChange - 중요도 변경 핸들러
 * @param {string} props.searchQuery - 검색어
 * @param {function} props.onSearchChange - 검색어 변경 핸들러
 */
export default function VaultFilters({
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  importanceFilter,
  onImportanceChange,
  searchQuery,
  onSearchChange,
}) {
  return (
    <div
      className="reveal flex flex-wrap gap-3 items-center"
      style={{ marginBottom: 32 }}
    >
      <Select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        style={{ width: 140 }}
      >
        <option value="">모든 유형</option>
        {ALL_DOCUMENT_TYPES.map((t) => (
          <option key={t} value={t}>
            {getTypeLabel(t)}
          </option>
        ))}
      </Select>

      <Select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        style={{ width: 140 }}
      >
        <option value="">모든 상태</option>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </Select>

      <Select
        value={importanceFilter}
        onChange={(e) => onImportanceChange(e.target.value)}
        style={{ width: 140 }}
      >
        <option value="">중요도</option>
        {IMPORTANCE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {"★".repeat(n)}
          </option>
        ))}
      </Select>

      <Input
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="제목, 저자 검색..."
        style={{ width: 220 }}
      />
    </div>
  );
}
