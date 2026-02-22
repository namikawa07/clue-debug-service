import { MemberAvatar } from "@/features/members/components/member-avatar";

interface MemberChipProps {
  name: string;
  memberId: string | null;
  members: Array<{ id: string; name: string; avatarColor?: { bg: string; text: string } }>;
}

export const MemberChip = ({ name, memberId, members }: MemberChipProps) => {
  const resolved = memberId
    ? members.find(m => m.id === memberId)
    : members.find(m => m.name.toLowerCase() === name.toLowerCase());

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 align-middle
                     bg-neutral-100 dark:bg-neutral-800/80
                     border border-neutral-200 dark:border-neutral-700 rounded-md">
      <MemberAvatar name={name} className="size-3.5 shrink-0" avatarColor={resolved?.avatarColor} />
      <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300
                       max-w-[110px] truncate">
        {name}
      </span>
    </span>
  );
};
