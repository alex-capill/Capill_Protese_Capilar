import type { SVGProps } from "react";

/**
 * Conjunto de ícones inline.
 *
 * Inline e não biblioteca: são ~20 ícones, todos com o mesmo traço de 1.8 e
 * `currentColor`, então herdam a cor do tema sem nenhuma configuração.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconWorkspace = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7.5" height="7.5" rx="2.2" />
    <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.2" />
    <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.2" />
    <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.2" />
  </Svg>
);

export const IconFunnel = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 5h17l-6.6 7.6v6.1l-3.8 2v-8.1L3.5 5Z" />
  </Svg>
);

export const IconTasks = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3.5 7 2 2 3.5-3.5" />
    <path d="m3.5 17 2 2 3.5-3.5" />
    <path d="M12.5 7h8M12.5 17h8" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.2" y="5" width="17.6" height="16" rx="3.2" />
    <path d="M3.2 10h17.6M8 3v4M16 3v4" />
  </Svg>
);

export const IconChart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);

export const IconInbox = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.2 13.5 6 5.2A2 2 0 0 1 7.9 4h8.2a2 2 0 0 1 1.9 1.2l2.8 8.3" />
    <path d="M3.2 13.5h4.4l1.3 2.4h6.2l1.3-2.4h4.4v4.3a2 2 0 0 1-2 2H5.2a2 2 0 0 1-2-2v-4.3Z" />
  </Svg>
);

export const IconSettings = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.4 14.4a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.11a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.11a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.11a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.11a1.7 1.7 0 0 0-1.49 1.37Z" />
  </Svg>
);

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </Svg>
);

export const IconFilter = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M7 12h10M10 17h4" />
  </Svg>
);

export const IconArrowUpRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 17 17 7M9 7h8v8" />
  </Svg>
);

export const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" />
    <path d="M13.7 19a2 2 0 0 1-3.4 0" />
  </Svg>
);

export const IconChevronDown = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 9 6 6 6-6" />
  </Svg>
);

export const IconChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="m15 6-6 6 6 6" />
  </Svg>
);

export const IconX = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
);

export const IconList = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Svg>
);

export const IconColumns = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.2" y="4" width="5.2" height="16" rx="2" />
    <rect x="9.9" y="4" width="5.2" height="11" rx="2" />
    <rect x="16.6" y="4" width="4.2" height="16" rx="2" />
  </Svg>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
    <path d="M6.5 7 7.4 19a2 2 0 0 0 2 1.9h5.2a2 2 0 0 0 2-1.9L17.5 7" />
  </Svg>
);

export const IconPencil = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h4L19.2 8.8a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="m14.8 4.2 3 3" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 7.4V12l3 1.8" />
  </Svg>
);

export const IconWhatsapp = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.6 20.4 5 16.4a7.9 7.9 0 1 1 3 3l-4.4 1Z" />
    <path d="M9 9.4c0 3 2.4 5.4 5.4 5.4l.9-1.6-2-.9-.8.9a4.4 4.4 0 0 1-1.9-1.9l.9-.8-.9-2-1.6.9Z" />
  </Svg>
);

export const IconGrip = (p: IconProps) => (
  <Svg {...p} strokeWidth="2.4">
    <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />
  </Svg>
);

export const IconUndo = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H9" />
    <path d="m8 5-4 4 4 4" />
  </Svg>
);

export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8.4" r="3.9" />
    <path d="M4.8 20.2a7.4 7.4 0 0 1 14.4 0" />
  </Svg>
);

export const IconMoney = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.8" y="6" width="18.4" height="12" rx="3" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6.4 12h.01M17.6 12h.01" />
  </Svg>
);
