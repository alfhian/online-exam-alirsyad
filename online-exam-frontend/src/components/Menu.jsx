import { useNavigate, useLocation } from "react-router-dom";
import { roleMenus, menus } from "../constants/menus";
import * as FaIcons from "react-icons/fa";

const Menus = ({ role, isOpen }) => {
  const allowedMenuNames = roleMenus[role] || [];
  const navigate = useNavigate();
  const location = useLocation();

  const filteredMenus = menus.filter((menu) =>
    allowedMenuNames.includes(menu.name)
  );

  return (
    <ul className="space-y-0.5">
      {filteredMenus.map((menu, index) => {
        const Icon = menu.icon ? FaIcons[menu.icon] : null;
        const isActive =
          location.pathname === menu.path ||
          (menu.path !== '/dashboard' && location.pathname.startsWith(`${menu.path}`));

        return (
          <li
            key={index}
            onClick={() => navigate(menu.path)}
            className={`group relative flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-all duration-200 rounded-lg
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

            {/* Label saat sidebar terbuka */}
            {isOpen && (
              <span
                className={`text-[11px] font-medium tracking-tight transition-colors duration-200`}
              >
                {menu.title}
              </span>
            )}

            {/* Tooltip saat sidebar tertutup */}
            {!isOpen && (
              <span
                className="absolute left-14 z-50 bg-slate-800 text-white text-[9px] font-bold uppercase tracking-wider py-1.5 px-2.5 rounded-md opacity-0 group-hover:opacity-100 shadow-xl transition-all duration-200 pointer-events-none whitespace-nowrap border border-slate-700"
              >
                {menu.title}
              </span>
            )}

            {/* Indicator Dot for active state when collapsed */}
            {isActive && !isOpen && (
              <span className="absolute right-1.5 h-1 w-1 bg-white rounded-full"></span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default Menus;
