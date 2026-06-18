import { useNavigate, useLocation } from "react-router-dom";
import { roleMenus, menus } from "../constants/menus";
import * as FaIcons from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";

const Menus = ({ role, isOpen, onNavigate }) => {
  const allowedMenuNames = roleMenus[role] || [];
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState({});

  const filteredMenus = useMemo(
    () => menus.filter((menu) => allowedMenuNames.includes(menu.name)),
    [role],
  );

  useEffect(() => {
    const activeGroup = filteredMenus.find((menu) =>
      menu.children?.some((child) => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`))
    );

    if (activeGroup) {
      setOpenGroups((prev) => ({ ...prev, [activeGroup.name]: true }));
    }
  }, [filteredMenus, location.pathname]);

  return (
    <ul className="space-y-0.5">
      {filteredMenus.map((menu, index) => {
        const Icon = menu.icon ? FaIcons[menu.icon] : null;
        const hasChildren = Array.isArray(menu.children) && menu.children.length > 0;
        const isGroupOpen = Boolean(openGroups[menu.name]);
        const isActive =
          location.pathname === menu.path ||
          (menu.path !== '/dashboard' && location.pathname.startsWith(`${menu.path}`)) ||
          menu.children?.some((child) => location.pathname === child.path || location.pathname.startsWith(`${child.path}/`));

        return (
          <li key={index}>
            <button
              type="button"
              onClick={() => {
                if (hasChildren) {
                  setOpenGroups((prev) => ({ ...prev, [menu.name]: !prev[menu.name] }));
                  return;
                }

                navigate(menu.path);
                onNavigate?.();
              }}
              className={`group relative flex w-full items-center gap-2.5 px-3 py-2 cursor-pointer transition-all duration-200 rounded-lg
                ${
                  isActive
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                }
              `}
            >
              {Icon && (
                <Icon
                  className={`text-base transition-all duration-200 ${
                    isActive ? "scale-105" : "group-hover:scale-105"
                  }`}
                />
              )}

              {isOpen && (
                <span className="min-w-0 flex-1 text-left text-[11px] font-medium tracking-tight transition-colors duration-200">
                  {menu.title}
                </span>
              )}

              {hasChildren && isOpen && (
                <FaIcons.FaChevronDown
                  className={`text-[9px] transition-transform duration-200 ${isGroupOpen ? "rotate-180" : ""}`}
                />
              )}

              {!isOpen && (
                <span className="absolute left-14 z-50 bg-slate-800 text-white text-[9px] font-bold uppercase tracking-wider py-1.5 px-2.5 rounded-md opacity-0 group-hover:opacity-100 shadow-xl transition-all duration-200 pointer-events-none whitespace-nowrap border border-slate-700">
                  {menu.title}
                </span>
              )}

              {isActive && !isOpen && (
                <span className="absolute right-1.5 h-1 w-1 bg-white rounded-full"></span>
              )}
            </button>

            {hasChildren && isOpen && isGroupOpen && (
              <ul className="mt-1 space-y-0.5 border-l border-slate-700/70 ml-4 pl-2">
                {menu.children.map((child) => {
                  const childActive =
                    location.pathname === child.path || location.pathname.startsWith(`${child.path}/`);

                  return (
                    <li key={child.name}>
                      <button
                        type="button"
                        onClick={() => {
                          navigate(child.path);
                          onNavigate?.();
                        }}
                        className={`w-full rounded-md px-2.5 py-1.5 text-left text-[10px] font-medium transition-colors ${
                          childActive
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                        }`}
                      >
                        {child.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default Menus;
