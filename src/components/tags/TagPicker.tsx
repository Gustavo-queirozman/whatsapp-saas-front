import type { WorkspaceTag } from '../../types/workspace'

type TagPickerProps = {
  tags: WorkspaceTag[]
  selectedTagIds: string[]
  onToggle: (tagId: string) => void
  emptyMessage?: string
}

const withAlpha = (color: string, alpha: string) =>
  color.startsWith('#') && color.length === 7 ? `${color}${alpha}` : color

export function TagPicker({
  tags,
  selectedTagIds,
  onToggle,
  emptyMessage = 'Nenhuma tag criada ainda.',
}: TagPickerProps) {
  if (!tags.length) {
    return <p className="text-sm leading-6 text-slate-500">{emptyMessage}</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const selected = selectedTagIds.includes(tag.id)

        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggle(tag.id)}
            className={[
              'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition',
              selected
                ? 'shadow-[0_10px_25px_rgba(15,23,42,0.08)]'
                : 'hover:-translate-y-0.5',
            ].join(' ')}
            style={{
              borderColor: withAlpha(tag.color, selected ? '5A' : '38'),
              backgroundColor: withAlpha(tag.color, selected ? '1F' : '10'),
              color: '#0f172a',
            }}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.name}
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
              {selected ? 'Aplicada' : 'Aplicar'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
