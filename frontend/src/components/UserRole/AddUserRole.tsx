import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
  NativeSelect,
  Switch

} from "@chakra-ui/react"

import { FormControl, FormLabel } from "@chakra-ui/form-control"

import { useState } from "react"
import { FaPlus } from "react-icons/fa"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import type { ApiError } from "../../client/core/ApiError"
import { RoleService, UsersService } from "../../client"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"

import { UserRoleService } from "../../client";

// Define the types we need
interface UserRoleCreate {
  user_id: string;
  role_id: string;
  is_active: boolean;
}

interface AddUserRoleProps {
  preselectedRoleId?: string;
  preselectedUserId?: string;
}

const AddUserRole = ({ preselectedRoleId, preselectedUserId }: AddUserRoleProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { showSuccessToast } = useCustomToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<UserRoleCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      user_id: preselectedUserId || "",
      role_id: preselectedRoleId || "",
      is_active: true
    },
  });

  // Fetch roles for dropdown
  const { data: rolesResponse, isLoading: isRolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => RoleService.readRoles(),
  });

  // Extract roles array from response 
  const roles = rolesResponse?.data || [];

  // Fetch users for dropdown
  const { data: usersResponse, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => UsersService.readUsers(),
  });

  // Extract users array from response 
  const users = usersResponse?.data || [];

  const mutation = useMutation({
    mutationFn: (data: UserRoleCreate) =>
      UserRoleService.createUserRole({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("User role assigned successfully.");
      reset();
      setIsOpen(false);
    },
    onError: (err: ApiError) => {
      handleError(err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["userroles"] });
    },
  });

  const onSubmit = (data: UserRoleCreate) => {
    mutation.mutate(data);
  };

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-userrole" my={4}>
          <FaPlus fontSize="16px" />
          Assign Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Assign Role to User</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Select a user and a role to assign.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.user_id}
                errorText={errors.user_id?.message}
                label="User"
              >
                <NativeSelect.Root key="plain" variant="plain">
                  <NativeSelect.Field
                    placeholder="Select User"
                    {...register("user_id", {
                      required: "User is required.",
                    })}
                  >
                    {Array.isArray(users) &&
                      users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email || user.full_name || user.id}
                        </option>
                      ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field>

              <Field
                required
                invalid={!!errors.role_id}
                errorText={errors.role_id?.message}
                label="Role"
              >
                <NativeSelect.Root key="plain" variant="plain">
                  <NativeSelect.Field
                    placeholder="Select Role"
                    {...register("role_id", {
                      required: "Role is required.",
                    })}
                  >
                    {Array.isArray(roles) &&
                      roles.map((role) => (
                        <option key={role.role_id} value={role.role_id}>
                          {role.role_name}
                        </option>
                      ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="is-active" mb="0">
                  Active
                </FormLabel>
                <Switch.Root>
                  <Switch.HiddenInput />
                  <Switch.Control
                    id="is-active"
                    {...register("is_active")}
                  />
                </Switch.Root>
              </FormControl>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
};

export default AddUserRole;