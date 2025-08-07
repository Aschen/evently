import React from "react";
import { 
  Box, 
  Pagination, 
  Typography, 
  Select, 
  MenuItem, 
  FormControl,
  Stack 
} from "@mui/material";

interface FavoritesPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  from: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const FavoritesPagination: React.FC<FavoritesPaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  from,
  onPageChange,
  onPageSizeChange,
}) => {
  const to = Math.min(from + pageSize, totalItems);
  const pageSizes = [10, 20, 50];

  if (totalItems === 0) {
    return null;
  }

  return (
    <Box sx={{ 
      display: "flex", 
      flexDirection: { xs: "column", sm: "row" },
      justifyContent: "space-between",
      alignItems: "center",
      gap: 2,
      mt: 4,
      pt: 3,
      borderTop: 1,
      borderColor: "divider",
    }}>
      <Typography variant="body2" color="text.secondary">
        Showing {from + 1}-{to} of {totalItems} results
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Items per page:
          </Typography>
          <FormControl size="small">
            <Select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              sx={{ minWidth: 70 }}
            >
              {pageSizes.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        )}
      </Stack>
    </Box>
  );
};