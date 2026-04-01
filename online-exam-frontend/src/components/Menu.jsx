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
    <ul className="space-y-1">
      {filteredMenus.map((menu, index) => {
        const Icon = menu.icon ? FaIcons[menu.icon] : null;
        const isActive =
          location.pathname === menu.path ||
          (menu.path !== '/dashboard' && location.pathname.startsWith(`${menu.path}`));

        return (
          <li
            key={index}
            onClick={() => navigate(menu.path)}
            className={`group relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-300 rounded-xl
              ${
                isActive
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }
            `}
          >
            {Icon && (
              <Icon
                className={`text-lg transition-all duration-300 ${
                  isActive ? "scale-110" : "group-hover:scale-110"
                }`}
              />
            )}

            {/* Label saat sidebar terbuka */}
            {isOpen && (
              <span
                className={`text-sm font-semibold tracking-wide transition-colors duration-200`}
              >
                {menu.title}
              </span>
            )}

            {/* Tooltip saat sidebar tertutup */}
            {!isOpen && (
              <span
                className="absolute left-20 z-50 bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider py-2 px-3 rounded-lg opacity-0 group-hover:opacity-100 shadow-2xl transition-all duration-300 pointer-events-none whitespace-nowrap border border-slate-700"
              >
                {menu.title}
              </span>
            )}

            {/* Indicator Dot for active state when collapsed */}
            {isActive && !isOpen && (
              <span className="absolute right-2 h-1.5 w-1.5 bg-white rounded-full"></span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default Menus;
