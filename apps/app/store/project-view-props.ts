// mobx
import { action, observable, runInAction, makeAutoObservable } from "mobx";

// services
import projectService from "services/project.service";

// types
import type { IProjectViewProps } from "types";

const initialViewProps: IProjectViewProps = {
  issueView: "list",
  groupByProperty: null,
  orderBy: "-created_at",
  showEmptyGroups: true,
  showSubIssues: true,
  calendarDateRange: "",
  filters: {
    type: null,
    priority: null,
    assignees: null,
    labels: null,
    state: null,
    state_group: null,
    subscriber: null,
    created_by: null,
    target_date: null,
  },
};

class ProjectViewPropsStore {
  viewProps: IProjectViewProps = initialViewProps;
  isViewPropsLoading: boolean = false;
  rootStore: any | null = null;

  constructor(_rootStore: any | null = null) {
    makeAutoObservable(this, {
      viewProps: observable.ref,
      loadViewProps: action,
      isViewPropsLoading: observable,
      updateViewProps: action,
    });

    this.rootStore = _rootStore;
  }

  /**
   * @description Fetch view props of a project and hydrate viewProps field
   */

  loadViewProps = async (workspaceSlug: string, projectId: string) => {
    this.isViewPropsLoading = true;
    try {
      const myProjectDetails = await projectService.projectMemberMe(
        workspaceSlug as string,
        projectId as string
      );

      runInAction(() => {
        this.viewProps = myProjectDetails.view_props;
        this.isViewPropsLoading = false;
      });
    } catch (error) {
      this.isViewPropsLoading = false;
      console.error("Fetching view props error", error);
    }
  };

  updateViewProps = async (
    workspaceSlug: string,
    projectId: string,
    viewProps: IProjectViewProps
  ) => {
    const originalViewProps = { ...this.viewProps };

    try {
      runInAction(() => {
        this.viewProps = viewProps;
      });

      await projectService.setProjectView(workspaceSlug, projectId, {
        view_props: viewProps,
      });
    } catch (error) {
      console.error("Updating view props error", error);

      // revert back to the original state on error
      runInAction(() => {
        this.viewProps = originalViewProps;
      });
      return error;
    }
  };
}

export default ProjectViewPropsStore;
