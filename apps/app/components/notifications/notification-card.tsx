import React from "react";

// next
import Image from "next/image";
import { useRouter } from "next/router";

// hooks
import useUserNotification from "hooks/use-user-notifications";
// icons
import { ArchiveIcon, ClockIcon, SingleCommentCard } from "components/icons";

// helper
import { stripHTML, replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
import { formatDateDistance, renderShortDateWithYearFormat } from "helpers/date-time.helper";

// type
import type { IUserNotification } from "types";

type NotificationCardProps = {
  notification: IUserNotification;
  markNotificationReadStatus: (notificationId: string) => void;
  markNotificationArchivedStatus: (notificationId: string) => void;
  setSelectedNotificationForSnooze: (notificationId: string) => void;
};

export const NotificationCard: React.FC<NotificationCardProps> = (props) => {
  const {
    notification,
    markNotificationReadStatus,
    markNotificationArchivedStatus,
    setSelectedNotificationForSnooze,
  } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <div
      key={notification.id}
      onClick={() => {
        markNotificationReadStatus(notification.id);
        router.push(
          `/${workspaceSlug}/projects/${notification.project}/issues/${notification.data.issue.id}`
        );
      }}
      className={`px-4 ${
        notification.read_at === null ? "bg-custom-primary-70/10" : "hover:bg-custom-background-200"
      }`}
    >
      <div className="relative group flex items-center gap-3 py-3 cursor-pointer border-b-2 border-custom-border-200">
        {notification.read_at === null && (
          <span className="absolute top-1/2 -left-2 -translate-y-1/2 w-1.5 h-1.5 bg-custom-primary-100 rounded-full" />
        )}
        <div className="flex w-full pl-2">
          <div className="pl-0 p-2">
            <div className="relative w-12 h-12  rounded-full">
              {notification.triggered_by_details.avatar &&
              notification.triggered_by_details.avatar !== "" ? (
                <Image
                  src={notification.triggered_by_details.avatar}
                  alt="profile image"
                  layout="fill"
                  objectFit="cover"
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-custom-background-100 rounded-full flex justify-center items-center">
                  <span className="text-custom-text-100 font-semibold text-lg">
                    {notification.triggered_by_details.first_name[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="w-full flex flex-col overflow-hidden">
            <div>
              <p>
                <span className="font-semibold text-custom-text-200">
                  {notification.triggered_by_details.first_name}{" "}
                  {notification.triggered_by_details.last_name}{" "}
                </span>
                {notification.data.issue_activity.verb}{" "}
                {notification.data.issue_activity.field !== "comment"
                  ? replaceUnderscoreIfSnakeCase(notification.data.issue_activity.field)
                  : "commented"}{" "}
                {notification.data.issue_activity.field !== "comment" ? "to" : ""}
                <span className="font-semibold text-custom-text-200">
                  {" "}
                  {notification.data.issue_activity.field !== "comment" ? (
                    notification.data.issue_activity.field === "target_date" ? (
                      renderShortDateWithYearFormat(notification.data.issue_activity.new_value)
                    ) : (
                      stripHTML(notification.data.issue_activity.new_value)
                    )
                  ) : (
                    <span>
                      {`"`}
                      {notification.data.issue_activity.new_value.length > 50
                        ? notification?.data?.issue_activity?.issue_comment?.slice(0, 50) + "..."
                        : notification.data.issue_activity.issue_comment}
                      {`"`}
                    </span>
                  )}
                </span>
              </p>
            </div>

            <div className="w-full flex items-center justify-between mt-3">
              <p className="truncate inline max-w-lg text-custom-text-300 text-sm mr-3">
                {notification.data.issue.identifier}-{notification.data.issue.sequence_id}{" "}
                {notification.data.issue.name}
              </p>
              <p className="text-custom-text-300 text-xs">
                {formatDateDistance(notification.created_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="absolute py-1 flex gap-x-3 right-0 top-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
          {[
            {
              id: 1,
              name: notification.read_at ? "Mark as Unread" : "Mark as Read",
              icon: SingleCommentCard,
              onClick: () => {
                markNotificationReadStatus(notification.id);
              },
            },
            {
              id: 2,
              name: notification.archived_at ? "Unarchive Notification" : "Archive Notification",
              icon: ArchiveIcon,
              onClick: () => {
                markNotificationArchivedStatus(notification.id);
              },
            },
            {
              id: 3,
              name: notification.snoozed_till ? "Unsnooze Notification" : "Snooze Notification",
              icon: ClockIcon,
              onClick: () => {
                setSelectedNotificationForSnooze(notification.id);
              },
            },
          ].map((item) => (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
              key={item.id}
              className="text-sm flex w-full items-center gap-x-2 hover:bg-custom-background-100 p-0.5 rounded"
            >
              <item.icon className="h-5 w-5 text-custom-text-300" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
