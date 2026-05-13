import type { WorkspaceTag } from '../../types/workspace'

type TagBadgeProps = {
  tag: WorkspaceTag
  size?: 'sm' | 'md'
}

const withAlpha = (color: string, alpha: string) =>
  color.startsWith('#') && color.length === 7 ? `${color}${alpha}` : color

export function TagBadge({ tag, size = 'sm' }: TagBadgeProps) {
  const isSmall = size === 'sm'

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border font-semibold text-slate-800',
        isSmall ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
      ].join(' ')}
      style={{
        borderColor: withAlpha(tag.color, '40'),
        backgroundColor: withAlpha(tag.color, '14'),
      }}
    >
      <span
        className={isSmall ? 'h-2 w-2 rounded-full' : 'h-2.5 w-2.5 rounded-full'}
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
    </span>
  )
}
