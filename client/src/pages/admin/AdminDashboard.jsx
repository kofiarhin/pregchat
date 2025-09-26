import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import content from "../../content/appContent.json";
import styles from "./adminDashboard.module.scss";
import { useCurrentUserQuery } from "../../features/auth/hooks/useAuth.js";
import { useAdminUsersQuery } from "../../features/admin/hooks/useAdminUsersQuery.js";
import { useAdminOrdersQuery } from "../../features/admin/hooks/useAdminOrdersQuery.js";
import { useUpdateOrderStatusMutation } from "../../features/admin/hooks/useUpdateOrderStatusMutation.js";

const statusFlow = ["pending", "processing", "shipped", "delivered"];

const getNextStatus = (status) => {
  const index = statusFlow.indexOf(status);
  if (index === -1 || index === statusFlow.length - 1) {
    return null;
  }
  return statusFlow[index + 1];
};

const canCancelStatus = (status) => status === "pending" || status === "processing";
const canRefundStatus = (status) => status === "delivered";

const formatDateTime = (value) => {
  if (!value) {
    return "";
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleString();
  } catch (error) {
    return "";
  }
};

const formatCurrency = (value) => {
  const number = Number.parseFloat(value);
  if (Number.isNaN(number)) {
    return "£0.00";
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(number);
};

const AdminDashboard = () => {
  const adminContent = content.admin;
  const { data: currentUser, isLoading: userLoading } = useCurrentUserQuery();
  const isAdmin = useMemo(
    () => currentUser?.isAdmin === true || currentUser?.role === "admin",
    [currentUser]
  );

  const [activeTab, setActiveTab] = useState("users");
  const userTabId = "admin-tab-users";
  const orderTabId = "admin-tab-orders";
  const userPanelId = "admin-panel-users";
  const orderPanelId = "admin-panel-orders";

  const [userSearchInput, setUserSearchInput] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(10);

  const [orderStatus, setOrderStatus] = useState("all");
  const [orderPage, setOrderPage] = useState(1);
  const [orderLimit, setOrderLimit] = useState(10);
  const [orderNotes, setOrderNotes] = useState({});

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setUserSearch(userSearchInput.trim());
      setUserPage(1);
    }, 300);
    return () => window.clearTimeout(handle);
  }, [userSearchInput]);

  useEffect(() => {
    setOrderPage(1);
  }, [orderStatus, orderLimit]);

  useEffect(() => {
    setUserPage(1);
  }, [userLimit]);

  const usersQuery = useAdminUsersQuery(
    { q: userSearch, page: userPage, limit: userLimit },
    { enabled: isAdmin }
  );

  const ordersQuery = useAdminOrdersQuery(
    { status: orderStatus === "all" ? "" : orderStatus, page: orderPage, limit: orderLimit },
    { enabled: isAdmin }
  );

  useEffect(() => {
    if (!Array.isArray(ordersQuery.data?.data)) {
      return;
    }
    setOrderNotes((prev) => {
      const next = { ...prev };
      ordersQuery.data.data.forEach((order) => {
        const id = order.id;
        if (id && next[id] === undefined) {
          next[id] = order.notes ?? "";
        }
      });
      return next;
    });
  }, [ordersQuery.data]);

  const updateOrderStatus = useUpdateOrderStatusMutation({
    onSuccess: (payload) => {
      const order = payload?.order ?? payload;
      if (!order?.id) {
        return;
      }
      setOrderNotes((prev) => ({
        ...prev,
        [order.id]: order.notes ?? "",
      }));
    },
  });

  if (userLoading) {
    return (
      <div className={styles.loadingState} aria-busy="true">
        <span className={styles.spinner} aria-hidden="true" />
        <p>{adminContent.users.loading}</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const { users, orders, tabs, pagination, title, subtitle, disclaimer } = adminContent;
  const statusLabels = orders.statusLabels || {};
  const orderItems = ordersQuery.data?.data ?? [];
  const orderPagination = ordersQuery.data?.pagination ?? {};
  const userItems = usersQuery.data?.data ?? [];
  const userPagination = usersQuery.data?.pagination ?? {};

  const handleProcess = (order) => {
    const nextStatus = getNextStatus(order.status);
    if (!nextStatus) {
      return;
    }
    updateOrderStatus.mutate({
      orderId: order.id,
      status: nextStatus,
      notes: orderNotes[order.id] ?? order.notes ?? "",
    });
  };

  const handleCancel = (order) => {
    if (!window.confirm(orders.confirmations.cancel)) {
      return;
    }
    updateOrderStatus.mutate({
      orderId: order.id,
      status: "canceled",
      notes: orderNotes[order.id] ?? order.notes ?? "",
    });
  };

  const handleRefund = (order) => {
    if (!window.confirm(orders.confirmations.refund)) {
      return;
    }
    updateOrderStatus.mutate({
      orderId: order.id,
      status: "refunded",
      notes: orderNotes[order.id] ?? order.notes ?? "",
    });
  };

  const isUpdatingOrder = (orderId) => {
    return (
      updateOrderStatus.isPending &&
      updateOrderStatus.variables?.orderId === orderId
    );
  };

  const renderUsersTable = () => {
    if (usersQuery.isLoading) {
      return <p className={styles.muted}>{users.loading}</p>;
    }

    if (usersQuery.isError) {
      return <p className={styles.error}>{users.error}</p>;
    }

    if (userItems.length === 0) {
      return (
        <p className={styles.muted}>
          {userSearch ? users.noResults : users.empty}
        </p>
      );
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{users.columns.name}</th>
              <th scope="col">{users.columns.email}</th>
              <th scope="col">{users.columns.role}</th>
              <th scope="col">{users.columns.createdAt}</th>
            </tr>
          </thead>
          <tbody>
            {userItems.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{formatDateTime(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderOrdersTable = () => {
    if (ordersQuery.isLoading) {
      return <p className={styles.muted}>{orders.loading}</p>;
    }

    if (ordersQuery.isError) {
      return <p className={styles.error}>{orders.error}</p>;
    }

    if (orderItems.length === 0) {
      return (
        <p className={styles.muted}>
          {orderStatus !== "all" ? orders.noResults : orders.empty}
        </p>
      );
    }

    return (
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{orders.columns.id}</th>
              <th scope="col">{orders.columns.customer}</th>
              <th scope="col">{orders.columns.total}</th>
              <th scope="col">{orders.columns.status}</th>
              <th scope="col">{orders.columns.createdAt}</th>
              <th scope="col" className={styles.actionsHeading}>
                {orders.actions.process}
              </th>
            </tr>
          </thead>
          <tbody>
            {orderItems.map((order) => {
              const label = statusLabels[order.status] ?? order.status;
              return (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>
                    <div className={styles.cellStack}>
                      <span>{order.customer?.name || ""}</span>
                      <span className={styles.subtle}>{order.customer?.email || ""}</span>
                    </div>
                  </td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>
                    <span className={styles.statusBadge}>{label}</span>
                  </td>
                  <td>{formatDateTime(order.createdAt)}</td>
                  <td>
                    <div className={styles.orderActions}>
                      <input
                        type="text"
                        className={styles.notesInput}
                        placeholder={orders.notesPlaceholder}
                        value={orderNotes[order.id] ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          setOrderNotes((prev) => ({
                            ...prev,
                            [order.id]: value,
                          }));
                        }}
                      />
                      <div className={styles.actionButtons}>
                        <button
                          type="button"
                          className={styles.primaryAction}
                          onClick={() => handleProcess(order)}
                          disabled={!getNextStatus(order.status) || isUpdatingOrder(order.id)}
                        >
                          {orders.actions.process}
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryAction}
                          onClick={() => handleCancel(order)}
                          disabled={!canCancelStatus(order.status) || isUpdatingOrder(order.id)}
                        >
                          {orders.actions.cancel}
                        </button>
                        <button
                          type="button"
                          className={styles.secondaryAction}
                          onClick={() => handleRefund(order)}
                          disabled={!canRefundStatus(order.status) || isUpdatingOrder(order.id)}
                        >
                          {orders.actions.refund}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderPagination = (
    paginationData,
    onPageChange,
    limit,
    onLimitChange,
    label,
    inputId
  ) => {
    const page = paginationData.page ?? 1;
    const totalPages = paginationData.totalPages ?? 1;

    return (
      <div className={styles.paginationRow}>
        <div className={styles.limitControls}>
          <label htmlFor={inputId} className={styles.subtle}>
            {label}
          </label>
          <select
            id={inputId}
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className={styles.select}
          >
            {[10, 20, 50].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.pageControls}>
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className={styles.secondaryAction}
          >
            {pagination.prev}
          </button>
          <span className={styles.subtle}>
            {page} / {Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={styles.secondaryAction}
          >
            {pagination.next}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </div>
      </header>
      <p className={styles.disclaimer}>{disclaimer}</p>
      <nav className={styles.tabs} aria-label="Admin sections" role="tablist">
        <button
          type="button"
          role="tab"
          id={userTabId}
          aria-controls={userPanelId}
          aria-selected={activeTab === "users"}
          className={activeTab === "users" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("users")}
        >
          {tabs.users}
        </button>
        <button
          type="button"
          role="tab"
          id={orderTabId}
          aria-controls={orderPanelId}
          aria-selected={activeTab === "orders"}
          className={activeTab === "orders" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("orders")}
        >
          {tabs.orders}
        </button>
      </nav>
      <section
        id={userPanelId}
        className={styles.tabPanel}
        role="tabpanel"
        aria-labelledby={userTabId}
        hidden={activeTab !== "users"}
      >
        <div className={styles.panelContent}>
          <div className={styles.controlsRow}>
            <label className={styles.visuallyHidden} htmlFor="user-search">
              {users.searchPlaceholder}
            </label>
            <input
              id="user-search"
              type="search"
              value={userSearchInput}
              onChange={(event) => setUserSearchInput(event.target.value)}
              placeholder={users.searchPlaceholder}
              className={styles.searchInput}
            />
          </div>
          {renderUsersTable()}
          {renderPagination(
            userPagination,
            setUserPage,
            userLimit,
            setUserLimit,
            users.paginationLabel,
            "admin-users-limit"
          )}
        </div>
      </section>
      <section
        id={orderPanelId}
        className={styles.tabPanel}
        role="tabpanel"
        aria-labelledby={orderTabId}
        hidden={activeTab !== "orders"}
      >
        <div className={styles.panelContent}>
          <div className={styles.controlsRow}>
            <label className={styles.filterLabel} htmlFor="order-status">
              {orders.statusFilter.label}
            </label>
            <select
              id="order-status"
              value={orderStatus}
              onChange={(event) => {
                setOrderStatus(event.target.value);
              }}
              className={styles.select}
            >
              <option value="all">{orders.statusFilter.all}</option>
              {Object.keys(statusLabels).map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
          {renderOrdersTable()}
          {renderPagination(
            orderPagination,
            setOrderPage,
            orderLimit,
            setOrderLimit,
            orders.paginationLabel,
            "admin-orders-limit"
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
